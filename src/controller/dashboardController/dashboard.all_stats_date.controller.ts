import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dashboard Controller with date range filtering and fallback to all data
export const getDashboardStatsByDateRange = async (
  req: Request,
  res: Response
) => {
  try {
    // Get date information from both query and body
    const startDateInput = req.query.startDate || req.body.startDate;
    const endDateInput = req.query.endDate || req.body.endDate;

    console.log('Date inputs:', { startDateInput, endDateInput });

    // Validate and parse dates
    let dateFilter = {};
    let parsedStartDate: Date | undefined = undefined;
    let parsedEndDate: Date | undefined = undefined;

    if (startDateInput && typeof startDateInput === 'string') {
      try {
        parsedStartDate = new Date(startDateInput);
        if (isNaN(parsedStartDate.getTime())) {
          console.error('Invalid start date format:', startDateInput);
          parsedStartDate = undefined;
        }
      } catch (e) {
        console.error('Error parsing start date:', e);
      }
    }

    if (endDateInput && typeof endDateInput === 'string') {
      try {
        parsedEndDate = new Date(endDateInput);
        if (isNaN(parsedEndDate.getTime())) {
          console.error('Invalid end date format:', endDateInput);
          parsedEndDate = undefined;
        } else {
          // Add one day to include the entire end date
          parsedEndDate.setHours(23, 59, 59, 999);
        }
      } catch (e) {
        console.error('Error parsing end date:', e);
      }
    }

    // Construct date filter if dates are valid
    if (parsedStartDate || parsedEndDate) {
      dateFilter = {
        createdAt: {
          ...(parsedStartDate && { gte: parsedStartDate }),
          ...(parsedEndDate && { lte: parsedEndDate })
        }
      };
    }

    // Get all ProductPack count (not filtered by date)
    const totalProductPacks = await prisma.productPack.count();

    // Get overall stats with date filtering
    const filteredOverallStats = await prisma.productProtsess.aggregate({
      where: dateFilter,
      _sum: {
        sendedCount: true,
        invalidCount: true,
        acceptCount: true,
      },
    });

    // Check if we have any data in the date range
    const filteredSendedCount = filteredOverallStats._sum.sendedCount || 0;
    const filteredInvalidCount = filteredOverallStats._sum.invalidCount || 0;
    const filteredAcceptCount = filteredOverallStats._sum.acceptCount || 0;
    const hasDataInDateRange = filteredSendedCount > 0 || filteredInvalidCount > 0 || filteredAcceptCount > 0;

    // If no data in date range, get all data without filtering
    let overallStats;
    let usingFallback = false;

    if (!hasDataInDateRange) {
      console.log('No data in specified date range, falling back to all data');
      overallStats = await prisma.productProtsess.aggregate({
        _sum: {
          sendedCount: true,
          invalidCount: true,
          acceptCount: true,
        },
      });
      usingFallback = true;
    } else {
      overallStats = filteredOverallStats;
    }

    // Calculate overall residueCount
    const overallSendedCount = overallStats._sum.sendedCount || 0;
    const overallInvalidCount = overallStats._sum.invalidCount || 0;
    const overallAcceptCount = overallStats._sum.acceptCount || 0;
    const overallResidueCount = overallAcceptCount - (overallSendedCount + overallInvalidCount);

    // Get all unique departments
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

        // Sum up totalCount for this department
        const totalCount = productPacksInDepartment.reduce(
          (sum, pack) => sum + pack.totalCount,
          0
        );

        // Get the IDs of all ProductPacks in this department
        const productPackIds = productPacksInDepartment.map((pack) => pack.id);

        // Construct department filter with product pack IDs
        const departmentFilter = {
          productpackId: {
            in: productPackIds,
          },
          ...(Object.keys(dateFilter).length > 0 && !usingFallback && dateFilter)
        };

        // Aggregate stats for this department
        const processStats = await prisma.productProtsess.aggregate({
          where: departmentFilter,
          _sum: {
            sendedCount: true,
            invalidCount: true,
            acceptCount: true,
          },
        });

        // Calculate stats for this department
        const sendedCount = processStats._sum.sendedCount || 0;
        const invalidCount = processStats._sum.invalidCount || 0;
        const acceptCount = processStats._sum.acceptCount || 0;
        const residueCount = acceptCount - (sendedCount + invalidCount);

        return {
          id: department,
          name: department,
          department,
          totalCount,
          protsessIsOver: acceptCount === (sendedCount + invalidCount),
          sendedCount,
          invalidCount,
          acceptCount,
          residueCount,
        };
      })
    );

    // Construct the response
    const dashboardData = {
      totalProductPacks,
      dateRange: {
        startDate: parsedStartDate
          ? parsedStartDate.toISOString()
          : "No start date specified",
        endDate: parsedEndDate
          ? parsedEndDate.toISOString()
          : "No end date specified",
      },
      usedFallbackData: usingFallback,
      overallStats: {
        sendedCount: overallSendedCount,
        invalidCount: overallInvalidCount,
        acceptCount: overallAcceptCount,
        residueCount: overallResidueCount,
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
      message:
        "Failed to fetch dashboard statistics for the specified date range",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
