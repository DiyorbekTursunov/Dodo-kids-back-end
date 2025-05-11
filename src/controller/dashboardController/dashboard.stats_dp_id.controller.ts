import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get detailed stats for a specific department
export const getDepartmentStats = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    // Check if the department exists
    const departmentExists = await prisma.department.findFirst({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Get all ProductPacks for this department
    const productPacks = await prisma.productPack.findMany({
      where: {
        departmentId,
      },
      select: {
        id: true,
        name: true,
        totalCount: true,
        protsessIsOver: true,
        department: true,
        Product: {
          select: {
            model: true,
          },
        },
      },
    });

    // Get the IDs of all ProductPacks in this department
    const productPackIds = productPacks.map((pack) => pack.id);

    // Get aggregated stats for all ProductPacks in this department
    const stats = await prisma.productProtsess.aggregate({
      where: {
        productpackId: {
          in: productPackIds,
        },
      },
      _sum: {
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
      },
    });

    // Get individual process records for all ProductPacks in this department
    const processes = await prisma.productProtsess.findMany({
      where: {
        productpackId: {
          in: productPackIds,
        },
      },
      select: {
        id: true,
        date: true,
        status: true,
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
        invalidReason: true,
        department: {
          select: {
            name: true,
          },
        },
        productPack: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate the total count of all products in this department
    const totalProductCount = productPacks.reduce(
      (sum, pack) => sum + pack.totalCount,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        departmentId,
        totalProductCount,
        productPackCount: productPacks.length,
        stats: {
          sendedCount: stats._sum.sendedCount || 0,
          invalidCount: stats._sum.invalidCount || 0,
          residueCount: stats._sum.residueCount || 0,
          acceptCount: stats._sum.acceptCount || 0,
        },
        productPacks,
        processes,
      },
    });
  } catch (error) {
    console.error("Error fetching department stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch department statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
