import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DateRangeBody {
  startDate?: string;
  endDate?: string;
}

interface DateFilter {
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

// Dashboard Controller with date range filtering
export const getDashboardStatsByDateRange = async (req: Request, res: Response) => {
  try {
    // Extract date range from request body
    const { startDate, endDate } = req.body as DateRangeBody;

    // Parse dates or use default date range
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Build date filter for ProductProtsess with proper typing
    const dateFilter: DateFilter = {};
    if (parsedStartDate || parsedEndDate) {
      dateFilter.createdAt = {};

      if (parsedStartDate) {
        dateFilter.createdAt.gte = parsedStartDate;
      }

      if (parsedEndDate) {
        dateFilter.createdAt.lte = parsedEndDate;
      }
    }

    // Get all ProductPack count (not filtered by date as these are static entities)
    const totalProductPacks = await prisma.productPack.count();

    // Get overall stats with date filtering
    const overallStats = await prisma.productProtsess.aggregate({
      where: dateFilter,
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

    // Get stats aggregated by department with date filtering
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

        // Aggregate stats for all ProductPacks in this department with date filtering
        const processStats = await prisma.productProtsess.aggregate({
          where: {
            productpackId: {
              in: productPackIds,
            },
            ...dateFilter, // Apply date filtering
          },
          _sum: {
            sendedCount: true,
            invalidCount: true,
            residueCount: true,
          },
        });

        return {
          id: department,
          name: department,
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
      dateRange: {
        startDate: parsedStartDate ? parsedStartDate.toISOString() : "No start date specified",
        endDate: parsedEndDate ? parsedEndDate.toISOString() : "No end date specified",
      },
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
    console.error("Error fetching dashboard stats with date range:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics for the specified date range",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
