import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dashboard Controller
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get all ProductPack count
    const totalProductPacks = await prisma.productPack.count();

    // Get overall stats
    const overallStats = await prisma.productProtsess.aggregate({
      _sum: {
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
      },
    });

    // Get all unique departments from ProductPacks
    const uniqueDepartments = await prisma.productPack.findMany({
      distinct: ["department"],
      select: {
        department: true,
      },
    });

    // Get stats aggregated by department
    const formattedProductPackStats = await Promise.all(
      uniqueDepartments.map(async ({ department }) => {
        // Get all ProductPacks for this department
        const productPacksInDepartment = await prisma.productPack.findMany({
          where: {
            department,
          },
          select: {
            id: true,
            totalCount: true,
          },
        });

        // Sum up totalCount for all products in this department
        const totalCount = productPacksInDepartment.reduce(
          (sum, pack) => sum + pack.totalCount,
          0
        );

        // Get the IDs of all ProductPacks in this department
        const productPackIds = productPacksInDepartment.map((pack) => pack.id);

        // Aggregate stats for all ProductPacks in this department
        const processStats = await prisma.productProtsess.aggregate({
          where: {
            productpackId: {
              in: productPackIds,
            },
          },
          _sum: {
            sendedCount: true,
            invalidCount: true,
            residueCount: true,
          },
        });

        return {
          id: department, // Using department as the ID for grouping
          name: department, // Using department name as the display name
          department,
          totalCount,
          protsessIsOver: false, // This doesn't make sense at department level
          sendedCount: processStats._sum.sendedCount || 0,
          invalidCount: processStats._sum.invalidCount || 0,
          residueCount: processStats._sum.residueCount || 0,
        };
      })
    );

    // Construct the response
    const dashboardData = {
      totalProductPacks,
      overallStats: {
        sendedCount: overallStats._sum.sendedCount || 0,
        invalidCount: overallStats._sum.invalidCount || 0,
        residueCount: overallStats._sum.residueCount || 0,
      },
      productPackStats: formattedProductPackStats,
    };

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
