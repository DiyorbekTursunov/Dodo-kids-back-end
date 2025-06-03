// src/controllers/invoice.controller.ts
import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface AcceptProductPackRequestBody {
  invoiceId: string;
  invalidCount?: number;
  invalidReason?: string;
  userId: string;
}

export const acceptProductPack = async (req: Request, res: Response) => {
  const { invoiceId, invalidCount = 0, invalidReason = "", userId } = req.body as AcceptProductPackRequestBody;

  // Validate required fields
  if (!invoiceId || !userId) {
    return res.status(400).json({ error: "invoiceId and userId are required" });
  }

  // Validate invalidCount
  if (typeof invalidCount !== "number" || invalidCount < 0 || !Number.isInteger(invalidCount)) {
    return res.status(400).json({ error: "invalidCount must be a non-negative integer" });
  }

  try {
    // Find user and employee
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.employee) {
      return res.status(400).json({ error: "User is not associated with an employee" });
    }

    const employeeId = user.employee.id;

    // Find invoice with status and product group
    const productPack = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        status: true,
        productGroup: true,
      },
    });

    if (!productPack) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Find pending status
    const pendingStatus = productPack.status.find((status) => status.status === "Pending");

    if (!pendingStatus) {
      return res.status(400).json({ error: "Invoice does not have a pending status" });
    }

    // Check if final "ombor" step from "upakofka"
    const isFinalOmbor =
      productPack.department.toLowerCase() === "ombor" &&
      pendingStatus.targetDepartment?.toLowerCase() === "upakofka";

    // Validate invalidCount
    const totalCount = productPack.totalCount;
    if (invalidCount > totalCount) {
      return res.status(400).json({
        error: `Invalid count (${invalidCount}) cannot exceed total count (${totalCount})`,
      });
    }

    // Calculate acceptCount
    const acceptCount = totalCount - invalidCount;

    // Transaction to update status and invoice
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sendingDepartment = pendingStatus.targetDepartment || "";

      // Delete pending status
      await tx.productProtsess.delete({
        where: { id: pendingStatus.id },
      });

      // Create new accepted status
      const newStatus = await tx.productProtsess.create({
        data: {
          departmentName: productPack.department,
          protsessIsOver: isFinalOmbor,
          status: "Qabul qilingan",
          departmentId: productPack.departmentId,
          targetDepartment: sendingDepartment,
          acceptanceDepartment: productPack.department,
          invoiceId,
          employeeId,
          acceptCount,
          sendedCount: 0,
          residueCount: 0, // All items are accepted or invalid
          invalidCount,
          invalidReason,
          date: new Date(), // Added per schema
        },
      });

      // Update invoice
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { protsessIsOver: isFinalOmbor },
      });

      return {
        newStatus,
        pendingStatusId: pendingStatus.id,
        isComplete: isFinalOmbor,
      };
    });

    // Success response
    return res.status(200).json({
      message: `Successfully accepted ${acceptCount} items${
        invalidCount > 0 ? ` and marked ${invalidCount} as invalid` : ""
      }${result.isComplete ? ". Process completed." : ""}`,
      deletedPendingStatus: result.pendingStatusId,
      newStatus: result.newStatus,
      isComplete: result.isComplete,
    });
  } catch (err: unknown) {
    console.error("Error accepting product pack:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: `Database error: ${err.message}` });
    }
    return res.status(500).json({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
