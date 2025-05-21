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

  // **Input Validation**
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
    // **Fetch Source Product Pack with Invoice and Product**
    const sourceProductPack = await prisma.productPack.findUnique({
      where: { id: productPackId },
      include: {
        Invoice: {
          include: {
            status: true,
          },
        },
        Product: true,
      },
    });

    if (!sourceProductPack) {
      return res.status(404).json({ error: "Product pack not found" });
    }

    const invoice = sourceProductPack.Invoice;
    const statusList = invoice.status;

    // **Fetch Target Department**
    let targetDepartment = await prisma.department.findUnique({
      where: { id: targetDepartmentId },
    });

    if (!targetDepartment) {
      return res.status(404).json({ error: "Target department not found" });
    }

    // **Handle Department Redirection (avsors -> chistka)**
    let actualTargetDepartmentId = targetDepartmentId;
    let actualTargetDepartmentName = targetDepartment.name;

    if (targetDepartment.name === "avsors") {
      const chistkaDepartment = await prisma.department.findFirst({
        where: { name: "chistka" }, // Fixed typo from "chiska" to "chistka"
      });

      if (!chistkaDepartment) {
        return res.status(404).json({ error: "Chistka department not found" });
      }

      actualTargetDepartmentId = chistkaDepartment.id;
      actualTargetDepartmentName = chistkaDepartment.name;
      targetDepartment = chistkaDepartment;
    }

    // **Get Latest Status**
    const latestStatus =
      statusList.length > 0
        ? statusList.reduce((latest, current) => {
            if (!latest) return current;
            if (latest.createdAt && current.createdAt) {
              return new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest;
            }
            return current;
          })
        : null;

    if (!latestStatus) {
      return res.status(400).json({ error: "Invoice has no status history" });
    }

    // **Get Total Count from Invoice**
    const totalCount = invoice.totalCount;

    // **Calculate Cumulative Counts**
    const currentlySentCount = statusList.reduce(
      (sum, status) => sum + (status.sendedCount || 0),
      0
    );
    const currentlyInvalidCount = statusList.reduce(
      (sum, status) => sum + (status.invalidCount || 0),
      0
    );

    // **Calculate New Totals**
    const newSendedCount = currentlySentCount + Number(sendCount);
    const newInvalidCount = currentlyInvalidCount + Number(invalidCount);
    const availableCount =
      totalCount - currentlySentCount - currentlyInvalidCount;

    // **Validate Available Count**
    if (Number(sendCount) + Number(invalidCount) > availableCount) {
      return res.status(400).json({
        error: "Cannot send more than available items",
        available: availableCount,
        requested: Number(sendCount) + Number(invalidCount),
      });
    }

    // **Determine Process Completion**
    const isComplete = newSendedCount + newInvalidCount === totalCount;
    const newStatus = isComplete ? "Yuborilgan" : "To'liq yuborilmagan";
    const residueCount = totalCount - newSendedCount - newInvalidCount;

    // **Create New Status for Source Invoice**
    const newSourceStatus = await prisma.productProtsess.create({
      data: {
        protsessIsOver: isComplete,
        status: newStatus,
        departmentName: invoice.department,
        departmentId: invoice.departmentId,
        invoiceId: invoice.id, // Corrected to link to Invoice, not ProductPack
        employeeId,
        acceptCount: latestStatus.acceptCount || totalCount,
        sendedCount: Number(sendCount),
        residueCount: residueCount,
        invalidCount: Number(invalidCount),
        invalidReason: invalidReason || "",
      },
    });

    // **Update Source Invoice if Complete**
    if (isComplete) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { protsessIsOver: true },
      });
    }

    // **Prepare Data for New Invoice**
    const perentId = invoice.perentId;
    const productName = sourceProductPack.Product?.name || "Unknown Product";

    // **Create New Invoice for Target Department**
    const newProductPack = await prisma.invoice.create({
      data: {
        perentId: perentId,
        number: invoice.number + 1, // Assuming number increments; adjust if needed
        departmentId: actualTargetDepartmentId,
        department: actualTargetDepartmentName,
        productId: sourceProductPack.productId ?? "", // Ensure productId is always a string
        totalCount: Number(sendCount),
        protsessIsOver: false,
        status: {
          create: {
            protsessIsOver: false,
            status: "Pending",
            departmentName: actualTargetDepartmentName,
            departmentId: actualTargetDepartmentId,
            targetDepartment: invoice.department,
            employeeId,
            acceptCount: 0,
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

    // **Return Success Response**
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
