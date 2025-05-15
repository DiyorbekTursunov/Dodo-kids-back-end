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

    // First check if any data exists in the date range
    const countInDateRange = await prisma.productProtsess.count({
      where: dateFilter
    });

    // For tracking if we had to use fallback data
    let usingFallback = false;
    let allProcesses = [];

    // Decide whether to use date filter or all data
    if (countInDateRange === 0) {
      console.log('No data in specified date range, falling back to all data');
      usingFallback = true;

      // Get all processes without date filtering
      allProcesses = await prisma.productProtsess.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          productPack: true
        }
      });
    } else {
      // Get processes within date range
      allProcesses = await prisma.productProtsess.findMany({
        where: dateFilter,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          productPack: true
        }
      });
    }

    // Get unique product pack IDs
    const uniqueProductPackIds = [...new Set(allProcesses.map(process => process.productpackId))];

    // For each product pack, get the latest process
    const latestProcessesByProductPack = uniqueProductPackIds.map(packId => {
      const packProcesses = allProcesses.filter(process => process.productpackId === packId);
      return packProcesses.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]; // Get the most recent
    });

    // Calculate overall stats from the latest entries
    const overallStats = {
      sendedCount: 0,
      invalidCount: 0,
      acceptCount: 0,
      residueCount: 0
    };

    latestProcessesByProductPack.forEach(process => {
      overallStats.sendedCount += process.sendedCount;
      overallStats.invalidCount += process.invalidCount;
      overallStats.acceptCount += process.acceptCount;
      overallStats.residueCount += process.residueCount;
    });

    // Get all departments
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Get stats aggregated by department
    const formattedProductPackStats = await Promise.all(
      departments.map(async (department) => {
        // Get ProductPacks associated with this department
        const productPacksInDepartment = await prisma.productPack.findMany({
          where: {
            departmentId: department.id,
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

        // Get all processes for this department
        const departmentFilter = {
          productpackId: {
            in: productPackIds
          },
          ...(Object.keys(dateFilter).length > 0 && !usingFallback ? dateFilter : {})
        };

        // Get department processes
        const departmentProcesses = await prisma.productProtsess.findMany({
          where: departmentFilter,
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Get the latest process for each product pack in this department
        const uniquePackIds = [...new Set(departmentProcesses.map(process => process.productpackId))];
        const latestDepartmentProcesses = uniquePackIds.map(packId => {
          const packProcesses = departmentProcesses.filter(process => process.productpackId === packId);
          return packProcesses.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        });

        // Calculate department stats
        let sendedCount = 0;
        let invalidCount = 0;
        let acceptCount = 0;
        let residueCount = 0;

        latestDepartmentProcesses.forEach(process => {
          if (process) {
            sendedCount += process.sendedCount;
            invalidCount += process.invalidCount;
            acceptCount += process.acceptCount;
            residueCount += process.residueCount;
          }
        });

        // Calculate if process is complete
        const protsessIsOver = productPacksInDepartment.length > 0 &&
          acceptCount > 0 &&
          sendedCount + invalidCount === acceptCount;

        return {
          id: department.id,
          name: department.name,
          department: department.name,
          totalCount,
          protsessIsOver,
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
      overallStats,
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
