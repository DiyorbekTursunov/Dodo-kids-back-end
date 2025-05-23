import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Gets counts for all models in the database
 */
export const getAllModelCounts = async (req: Request, res: Response) => {
  try {
    // Get counts for all models
    const [
      colorCount,
      sizeCount,
      departmentCount,
      employeeCount,
      userCount,
      invoiceCount, // Corrected: Renamed to match prisma.invoice.count()
      productCount,
      productProtsessCount,
    ] = await Promise.all([
      prisma.color.count(),
      prisma.size.count(),
      prisma.department.count(),
      prisma.employee.count(),
      prisma.user.count(),
      prisma.invoice.count(), // Corrected: Using invoice instead of productPack
      prisma.product.count(),
      prisma.productProtsess.count(),
    ]);

    // Get user count by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    // Format user role counts
    const userRoleCounts = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Get top colors by ProductColorSize count (assuming intermediate table)
    const topColors = await prisma.color.findMany({
      include: {
        _count: {
          select: { ProductColorSize: true }, // Corrected: Use ProductColorSize instead of Product
        },
      },
      orderBy: {
        ProductColorSize: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Get top sizes by ProductColorSize count (assuming intermediate table)
    const topSizes = await prisma.size.findMany({
      include: {
        _count: {
          select: { ProductColorSize: true }, // Corrected: Use ProductColorSize instead of Product
        },
      },
      orderBy: {
        ProductColorSize: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Get department stats with employee and process counts
    const departmentStats = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            Employee: true,
            ProductProtsess: true,
          },
        },
      },
    });

    // Calculate process completion percentage for each department
    const departmentProcessStats = await Promise.all(
      departmentStats.map(async (dept) => {
        const totalProcesses = await prisma.productProtsess.count({
          where: { departmentId: dept.id },
        });

        const completedProcesses = await prisma.productProtsess.count({
          where: {
            departmentId: dept.id,
            protsessIsOver: true,
          },
        });

        const completionPercentage =
          totalProcesses > 0
            ? Math.round((completedProcesses / totalProcesses) * 100)
            : 0;

        return {
          id: dept.id,
          name: dept.name,
          employeeCount: dept._count.Employee,
          processCount: dept._count.ProductProtsess,
          completedProcesses,
          completionPercentage,
        };
      })
    );

    // Get top product groups (assuming Product has no 'model' field)
    const topProductGroups = await prisma.productGroup.findMany({
      include: {
        _count: {
          select: { products: true }, // Count related products
        },
      },
      orderBy: {
        products: {
          _count: "desc",
        },
      },
      take: 10,
    });

    // Format the response
    const modelCounts = {
      basicCounts: {
        colors: colorCount,
        sizes: sizeCount,
        departments: departmentCount,
        employees: employeeCount,
        users: userCount,
        invoices: invoiceCount, // Corrected: Renamed to 'invoices' for consistency
        products: productCount,
        processes: productProtsessCount,
      },
      detailedStats: {
        usersByRole: userRoleCounts,
        topColors: topColors.map((color) => ({
          id: color.id,
          name: color.name,
          productColorSizeCount: color._count.ProductColorSize, // Corrected: Updated field name
        })),
        topSizes: topSizes.map((size) => ({
          id: size.id,
          name: size.name,
          productColorSizeCount: size._count.ProductColorSize, // Corrected: Updated field name
        })),
        departmentStats: departmentProcessStats,
        topProductGroups: topProductGroups.map((pg) => ({
          groupName: pg.name,
          productCount: pg._count.products, // Corrected: Reflects product groups
        })),
      },
    };

    return res.status(200).json({
      success: true,
      data: modelCounts,
    });
  } catch (error) {
    console.error("Error fetching model counts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch model counts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get counts with date range filtering
 */
export const getModelCountsByDateRange = async (req: Request, res: Response) => {
  try {
    // Get date information from both query and body
    const startDateInput = req.query.startDate || req.body.startDate;
    const endDateInput = req.query.endDate || req.body.endDate;

    // Validate and parse dates
    let parsedStartDate: Date | undefined = undefined;
    let parsedEndDate: Date | undefined = undefined;

    if (startDateInput && typeof startDateInput === "string") {
      parsedStartDate = new Date(startDateInput);
      if (isNaN(parsedStartDate.getTime())) {
        parsedStartDate = undefined;
      }
    }

    if (endDateInput && typeof endDateInput === "string") {
      parsedEndDate = new Date(endDateInput);
      if (isNaN(parsedEndDate.getTime())) {
        parsedEndDate = undefined;
      } else {
        // Include the entire end date
        parsedEndDate.setHours(23, 59, 59, 999);
      }
    }

    // Require at least one valid date
    if (!parsedStartDate && !parsedEndDate) {
      return res.status(400).json({
        success: false,
        message: "At least one valid date (startDate or endDate) must be provided",
      });
    }

    // Construct date filter
    const dateFilterCondition: Record<string, any> = {
      createdAt: {
        ...(parsedStartDate && { gte: parsedStartDate }),
        ...(parsedEndDate && { lte: parsedEndDate }),
      },
    };

    // Get counts for all models with date filtering
    const [
      colorCount,
      sizeCount,
      departmentCount,
      employeeCount,
      userCount,
      invoiceCount, // Corrected: Renamed to match prisma.invoice.count()
      productCount,
      productProtsessCount,
    ] = await Promise.all([
      prisma.color.count({ where: dateFilterCondition }),
      prisma.size.count({ where: dateFilterCondition }),
      prisma.department.count({ where: dateFilterCondition }),
      prisma.employee.count({ where: dateFilterCondition }),
      prisma.user.count({ where: dateFilterCondition }),
      prisma.invoice.count({ where: dateFilterCondition }), // Corrected: Using invoice instead of productPack
      prisma.product.count({ where: dateFilterCondition }),
      prisma.productProtsess.count({ where: dateFilterCondition }),
    ]);

    // Format the response
    const modelCounts = {
      dateRange: {
        startDate: parsedStartDate
          ? parsedStartDate.toISOString()
          : "No start date specified",
        endDate: parsedEndDate
          ? parsedEndDate.toISOString()
          : "No end date specified",
      },
      counts: {
        colors: colorCount,
        sizes: sizeCount,
        departments: departmentCount,
        employees: employeeCount,
        users: userCount,
        invoices: invoiceCount, // Corrected: Renamed to 'invoices' for consistency
        products: productCount,
        processes: productProtsessCount,
      },
    };

    return res.status(200).json({
      success: true,
      data: modelCounts,
    });
  } catch (error) {
    console.error("Error fetching model counts with date range:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch model counts for the specified date range",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
