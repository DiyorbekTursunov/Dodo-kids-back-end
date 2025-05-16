import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Send Product Pack to another department
export const sendToDepartment = async (req: Request, res: Response) => {
  const {
    productPackId,
    targetDepartmentId,
    sendCount,
    invalidCount = 0,
    invalidReason = "",
    employeeId,
  } = req.body;

  if (
    !productPackId ||
    !targetDepartmentId ||
    !sendCount ||
    sendCount <= 0 ||
    !employeeId
  ) {
    return res
      .status(400)
      .json({ error: "Required fields are missing or invalid" });
  }

  try {
    // Find the source product pack
    const sourceProductPack = await prisma.productPack.findUnique({
      where: { id: productPackId },
      include: {
        status: true,
        Product: true,
      },
    });

    if (!sourceProductPack) {
      return res.status(404).json({ error: "Product pack not found" });
    }

    // Get target department
    let targetDepartment = await prisma.department.findUnique({
      where: { id: targetDepartmentId },
    });

    if (!targetDepartment) {
      return res.status(404).json({ error: "Target department not found" });
    }

    // Check if target department is "avsors", redirect to "chistka" if it is
    let actualTargetDepartmentId = targetDepartmentId;
    let actualTargetDepartmentName = targetDepartment.name;

    if (targetDepartment.name === "avsors") {
      // Find the chistka department
      const chistkaDepartment = await prisma.department.findFirst({
        where: { name: "chiska" },
      });

      if (!chistkaDepartment) {
        return res.status(404).json({ error: "Chistka department not found" });
      }

      // Update the target department to chistka
      actualTargetDepartmentId = chistkaDepartment.id;
      actualTargetDepartmentName = chistkaDepartment.name;
      targetDepartment = chistkaDepartment;
    }

    // Find the latest status - handling TypeScript's strong typing
    const latestStatus =
      sourceProductPack.status.length > 0
        ? sourceProductPack.status.reduce((latest, current) => {
            // Compare dates if available, or just use the latest in the array
            if (!latest) return current;
            if (latest.createdAt && current.createdAt) {
              return new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest;
            }
            return current; // Default to current if no dates
          })
        : null;

    if (!latestStatus) {
      return res
        .status(400)
        .json({ error: "Product pack has no status history" });
    }

    // Get the total count from the product pack
    const totalCount = sourceProductPack.totalCount;

    // Calculate the cumulative counts by summing across ALL status entries
    const currentlySentCount = sourceProductPack.status.reduce(
      (sum, status) => {
        // Only count entries where sendedCount was increased
        return sum + (status.sendedCount || 0);
      },
      0
    );

    const currentlyInvalidCount = sourceProductPack.status.reduce(
      (sum, status) => {
        // Only count entries where invalidCount was increased
        return sum + (status.invalidCount || 0);
      },
      0
    );

    // Calculate new cumulative totals after this operation
    const newSendedCount = currentlySentCount + Number(sendCount);
    const newInvalidCount = currentlyInvalidCount + Number(invalidCount);

    // Calculate how many items are still available to send or mark as invalid
    const availableCount =
      totalCount - currentlySentCount - currentlyInvalidCount;

    // Validate sending count doesn't exceed available
    if (Number(sendCount) + Number(invalidCount) > availableCount) {
      return res.status(400).json({
        error: "Cannot send more than available items",
        available: availableCount,
        requested: Number(sendCount) + Number(invalidCount),
      });
    }

    // Determine if this operation completes the process
    const isComplete = newSendedCount + newInvalidCount === totalCount;
    const newStatus = isComplete ? "Yuborilgan" : "To'liq yuborilmagan";

    // Calculate remaining items after this operation
    const residueCount = totalCount - newSendedCount - newInvalidCount;

    // Create a new status for the source product pack
    const newSourceStatus = await prisma.productProtsess.create({
      data: {
        protsessIsOver: isComplete,
        status: newStatus,
        departmentName: sourceProductPack.department,
        departmentId: sourceProductPack.departmentId,
        productpackId: productPackId,
        employeeId,
        acceptCount: latestStatus.acceptCount || totalCount,
        sendedCount: Number(sendCount), // Only record what's being sent in this operation
        residueCount: residueCount,
        invalidCount: Number(invalidCount), // Only record what's being marked invalid in this operation
        invalidReason: invalidReason || "",
      },
    });

    // Update the source ProductPack's protsessIsOver flag if needed
    if (isComplete) {
      await prisma.productPack.update({
        where: { id: productPackId },
        data: { protsessIsOver: true },
      });
    }

    // Get the parent ID from the source product pack
    // If source pack doesn't have a parent (it's a root pack), use its own ID as parent
    const perentId = sourceProductPack.perentId;

    // Create a new ProductPack for the target department
    const newProductPack = await prisma.productPack.create({
      data: {
        perentId: perentId, // Use the field name 'perentId' as defined in the schema
        name: `${sourceProductPack.name} - ${actualTargetDepartmentName}`,
        departmentId: actualTargetDepartmentId,
        department: actualTargetDepartmentName,
        productId: sourceProductPack.productId,
        totalCount: Number(sendCount),
        protsessIsOver: false,
        // Initialize with default ProductProtsess if needed
        status: {
          create: {
            protsessIsOver: false,
            status: "Pending", // Initial status is "Pending"
            departmentName: actualTargetDepartmentName,
            departmentId: actualTargetDepartmentId,
            targetDepartment: sourceProductPack.department,
            employeeId,
            acceptCount: 0, // Will be updated when target department accepts
            sendedCount: 0,
            residueCount: Number(sendCount),
            invalidCount: 0,
            invalidReason: "",
          },
        },
      },
      include: {
        status: true,
        Product: true,
      },
    });

    // Return the updated information
    res.status(200).json({
      message: `Successfully sent ${sendCount} items to ${actualTargetDepartmentName} department`,
      sourceStatus: newSourceStatus,
      newProductPack,
      remainingItems: residueCount,
    });
  } catch (err) {
    console.error("Error sending product to department:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
