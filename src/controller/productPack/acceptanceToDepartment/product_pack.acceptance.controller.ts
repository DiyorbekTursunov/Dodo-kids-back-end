import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const acceptProductPack = async (req: Request, res: Response) => {
  const {
    invoiceId,
    invalidCount = 0,
    invalidReason = "",
    userId, // Expecting userId from client
  } = req.body;

  // Validate required fields
  if (!invoiceId || !userId) {
    return res
      .status(400)
      .json({ error: "Required fields are missing or invalid" });
  }

  try {
    // Step 1: Find the user by userId and include their employee details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true }, // Correct: Use 'employee' as per one-to-one schema
    });

    // Step 2: Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Step 3: Check if user is associated with an employee
    if (!user.employee) {
      return res
        .status(400)
        .json({ error: "User is not associated with an employee" });
    }

    // Step 4: Get the employeeId from the employee
    const employeeId = user.employee.id;

    // Step 5: Find the product pack with its pending status
    const productPack = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        status: true,
        ProductGroup: true,
      },
    });

    if (!productPack) {
      return res.status(404).json({ error: "Product pack not found" });
    }

    // Step 6: Find the pending status
    const pendingStatus = productPack.status.find(
      (status) => status.status === "Pending"
    );

    if (!pendingStatus) {
      return res
        .status(400)
        .json({ error: "Product pack does not have a pending status" });
    }

    // Step 7: Check if department is "ombor" and sent from "upakofka" to mark process complete
    const isFinalOmbor =
      productPack.department.toLowerCase() === "ombor" &&
      pendingStatus.targetDepartment?.toLowerCase() === "upakofka";

    // Step 8: Validate that invalidCount doesn't exceed totalCount
    const totalCount = productPack.totalCount;
    if (Number(invalidCount) > totalCount) {
      return res.status(400).json({
        error: "Invalid count cannot exceed total count",
        total: totalCount,
      });
    }

    // Step 9: Calculate acceptCount
    const acceptCount = totalCount - Number(invalidCount);

    // Step 10: Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prismaClient) => {
      // Save the targetDepartment from the pending status
      const sendingDepartment = pendingStatus.targetDepartment || "";

      // Delete the pending status
      await prismaClient.productProtsess.delete({
        where: { id: pendingStatus.id },
      });

      // Since we're accepting all non-invalid items, residueCount is always 0
      const residueCount = 0;

      // Create new accepted status
      const newStatus = await prismaClient.productProtsess.create({
        data: {
          departmentName: productPack.department,
          protsessIsOver: isFinalOmbor, // True only if ombor accepts from upakofka
          status: "Qabul qilingan",
          departmentId: productPack.departmentId,
          targetDepartment: sendingDepartment, // Preserve the sending department
          acceptanceDepartment: productPack.department,
          invoiceId: invoiceId,
          employeeId, // Use the retrieved employeeId
          acceptCount,
          sendedCount: 0,
          residueCount,
          invalidCount: Number(invalidCount),
          invalidReason: invalidReason || "",
        },
      });

      // Update the product pack
      await prismaClient.invoice.update({
        where: { id: invoiceId },
        data: { protsessIsOver: isFinalOmbor },
      });

      return {
        newStatus,
        pendingStatusId: pendingStatus.id,
        isComplete: isFinalOmbor,
      };
    });

    // Step 11: Return success response
    res.status(200).json({
      message: `Successfully accepted ${acceptCount} items${
        invalidCount > 0 ? ` and marked ${invalidCount} as invalid` : ""
      }${
        result.isComplete
          ? ". Process completed as ombor accepted from upakofka."
          : ""
      }`,
      deletedPendingStatus: result.pendingStatusId,
      newStatus: result.newStatus,
      isComplete: result.isComplete,
    });
  } catch (err) {
    console.error("Error accepting product pack:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
