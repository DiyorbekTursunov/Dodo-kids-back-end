import { Request, Response } from "express";
import { PrismaClient, ProductProtsess } from "@prisma/client";

const prisma = new PrismaClient();

// Define allowed department transitions
// const departmentFlow: { [key: string]: string[] } = {
//   ombor: ["bichuv"],
//   bichuv: ["tasnif"],
//   tasnif: ["pechat", "autsorsPechat"],
//   pechat: ["tasnif-2"],
//   autsorsPechat: ["tasnif-2"],
//   "tasnif-2": ["tikuv", "autsorsTikuv"],
//   tikuv: ["chistka"],
//   autsorsTikuv: ["chistka"],
//   chistka: ["kontrol"],
//   kontrol: ["dazmol"],
//   dazmol: ["upakofka"],
//   upakofka: ["ombor"],
// };

export const sendToDepartment = async (req: Request, res: Response) => {
  const {
    invoiceId,
    targetDepartmentId,
    sendCount: sendCountStr,
    invalidCount: invalidCountStr = "0",
    invalidReason = "",
    employeeId,
  } = req.body;

  // Validate required fields
  if (!invoiceId || !targetDepartmentId || !sendCountStr || !employeeId) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  const sendCount = Number(sendCountStr);
  const invalidCount = Number(invalidCountStr);

  // Validate numeric inputs
  if (!Number.isInteger(sendCount) || sendCount <= 0) {
    return res
      .status(400)
      .json({ error: "sendCount must be a positive integer" });
  }
  if (!Number.isInteger(invalidCount) || invalidCount < 0) {
    return res
      .status(400)
      .json({ error: "invalidCount must be a non-negative integer" });
  }

  try {
    // Fetch the source invoice with its status history
    const sourceInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { status: true, ProductGroup: true },
    });

    if (!sourceInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const statusList = sourceInvoice.status;

    // Fetch the target department
    const targetDepartment = await prisma.department.findUnique({
      where: { id: targetDepartmentId },
    });

    if (!targetDepartment) {
      return res.status(404).json({ error: "Target department not found" });
    }

    // Handle special case: redirect "avsors" to "chistka"
    let actualTargetDepartment = targetDepartment;
    if (targetDepartment.name === "avsors") {
      const chistkaDepartment = await prisma.department.findFirst({
        where: { name: "chistka" },
      });
      if (!chistkaDepartment) {
        return res.status(404).json({ error: "Chistka department not found" });
      }
      actualTargetDepartment = chistkaDepartment;
    }

    // // Validate department transition
    // const currentDepartment = sourceInvoice.department;
    // const possibleNextDepartments = departmentFlow[currentDepartment.toLowerCase()] || [];

    // if (!possibleNextDepartments.includes(actualTargetDepartment.name)) {
    //   return res.status(400).json({
    //     error: `Invalid transition from ${currentDepartment} to ${
    //       actualTargetDepartment.name
    //     }. Valid next departments: ${possibleNextDepartments.join(", ")}`,
    //   });
    // }

    // Find the latest status with explicit typing
    const latestStatus =
      statusList.length > 0
        ? statusList.reduce(
            (latest: ProductProtsess, current: ProductProtsess) =>
              new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest
          )
        : null;

    if (!latestStatus) {
      return res.status(400).json({ error: "Invoice has no status history" });
    }

    // Calculate available items
    const totalCount = sourceInvoice.totalCount;
    const currentlySentCount = statusList.reduce(
      (sum, status) => sum + (status.sendedCount || 0),
      0
    );
    const currentlyInvalidCount = statusList.reduce(
      (sum, status) => sum + (status.invalidCount || 0),
      0
    );
    const availableCount =
      totalCount - currentlySentCount - currentlyInvalidCount;

    // Validate send and invalid counts
    if (sendCount + invalidCount > availableCount) {
      return res.status(400).json({
        error: "Cannot send more than available items",
        available: availableCount,
        requested: sendCount + invalidCount,
      });
    }

    const newSendedCount = currentlySentCount + sendCount;
    const newInvalidCount = currentlyInvalidCount + invalidCount;
    const isComplete = newSendedCount + newInvalidCount === totalCount;
    const residueCount = totalCount - newSendedCount - newInvalidCount;

    // Perform operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Create new status for the source invoice
      const newSourceStatus = await tx.productProtsess.create({
        data: {
          protsessIsOver: isComplete,
          status: isComplete ? "Yuborilgan" : "To'liq yuborilmagan",
          departmentName: sourceInvoice.department,
          departmentId: sourceInvoice.departmentId,
          invoiceId: sourceInvoice.id,
          employeeId,
          acceptCount: latestStatus.acceptCount || totalCount,
          sendedCount: sendCount,
          residueCount,
          invalidCount,
          invalidReason,
        },
      });

      // Update source invoice if process is complete
      if (isComplete) {
        await tx.invoice.update({
          where: { id: sourceInvoice.id },
          data: { protsessIsOver: true },
        });
      }

      // Create a new invoice for the target department
      const newInvoice = await tx.invoice.create({
        data: {
          perentId: sourceInvoice.perentId,
          number: sourceInvoice.number + 1, // Increment number (consider a unique strategy if needed)
          departmentId: actualTargetDepartment.id,
          department: actualTargetDepartment.name,
          productGroupId: sourceInvoice.productGroupId,
          totalCount: sendCount,
          protsessIsOver: false,
          status: {
            create: {
              protsessIsOver: false,
              status: "Pending",
              departmentName: actualTargetDepartment.name,
              departmentId: actualTargetDepartment.id,
              targetDepartment: sourceInvoice.department,
              acceptanceDepartment: actualTargetDepartment.name,
              employeeId,
              acceptCount: 0,
              sendedCount: 0,
              residueCount: sendCount,
              invalidCount: 0,
              invalidReason: "",
            },
          },
        },
        include: { status: true },
      });

      // Send success response
      res.status(200).json({
        message: `Successfully sent ${sendCount} items to ${actualTargetDepartment.name}`,
        sourceStatus: newSourceStatus,
        newInvoice,
        remainingItems: residueCount,
      });
    });
  } catch (err) {
    console.error("Error sending product to department:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
