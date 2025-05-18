import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Accept a Product Pack that was sent from another department
export const acceptProductPack = async (req: Request, res: Response) => {
  const {
    productPackId,
    acceptCount,
    employeeId,
  } = req.body;

  if (!productPackId || acceptCount === undefined || acceptCount < 0 || !employeeId) {
    return res
      .status(400)
      .json({ error: "Required fields are missing or invalid" });
  }

  try {
    // Find the product pack
    const productPack = await prisma.productPack.findUnique({
      where: { id: productPackId },
      include: {
        status: true,
        Product: true,
      },
    });

    if (!productPack) {
      return res.status(404).json({ error: "Product pack not found" });
    }

    // Find the pending status entry to delete
    const pendingStatus = productPack.status.find(
      (status) => status.status === "Pending"
    );

    if (!pendingStatus) {
      return res.status(400).json({ error: "No pending status found for this product pack" });
    }

    // Delete the pending status
    await prisma.productProtsess.delete({
      where: { id: pendingStatus.id },
    });

    // Get the total count from the product pack
    const totalCount = productPack.totalCount;

    // Validate accepting count doesn't exceed total
    if (Number(acceptCount) > totalCount) {
      return res.status(400).json({
        error: "Cannot accept more than total items",
        total: totalCount,
        requested: Number(acceptCount),
      });
    }

    // Calculate residue count after acceptance
    const residueCount = totalCount - Number(acceptCount);

    // Create a new status with "Qabul qilingan" (Accepted) status
    const newStatus = await prisma.productProtsess.create({
      data: {
        protsessIsOver: false,
        status: "Qabul qilingan",
        departmentName: productPack.department,
        departmentId: productPack.departmentId,
        productpackId: productPackId,
        employeeId,
        acceptCount: Number(acceptCount),
        sendedCount: 0,
        residueCount: residueCount,
        invalidCount: 0,
        invalidReason: "",
        // If you need to track source department info
        targetDepartment: pendingStatus.targetDepartment || "",
        acceptanceDepartment: productPack.department,
      },
    });

    // Check if we need to mark as complete if all items were rejected
    if (acceptCount === 0) {
      await prisma.productPack.update({
        where: { id: productPackId },
        data: { protsessIsOver: true },
      });
    }

    // Return the updated information
    res.status(200).json({
      message: `Successfully accepted ${acceptCount} items in ${productPack.department} department`,
      newStatus: newStatus,
      remainingItems: residueCount,
    });
  } catch (err) {
    console.error("Error accepting product pack:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
