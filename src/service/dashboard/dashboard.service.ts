import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Existing getDashboardStatsByDateRangeService (unchanged, included for context)
export const getDashboardStatsByDateRangeService = async (
  startDateInput?: string,
  endDateInput?: string
): Promise<any> => {
  try {
    let parsedStartDate: Date | undefined = undefined;
    let parsedEndDate: Date | undefined = undefined;

    if (startDateInput) {
      parsedStartDate = new Date(startDateInput);
      if (isNaN(parsedStartDate.getTime())) {
        throw new Error("Invalid startDate format");
      }
    }

    if (endDateInput) {
      parsedEndDate = new Date(endDateInput);
      if (isNaN(parsedEndDate.getTime())) {
        throw new Error("Invalid endDate format");
      }
      parsedEndDate.setHours(23, 59, 59, 999);
    }

    if (!parsedStartDate && !parsedEndDate) {
      throw new Error("At least one valid date must be provided");
    }

    const dateFilter: Prisma.InvoiceWhereInput = {
      createdAt: {
        ...(parsedStartDate && { gte: parsedStartDate }),
        ...(parsedEndDate && { lte: parsedEndDate }),
      },
    };

    const totalProductPacks = await prisma.invoice.count({ where: dateFilter });

    const overallStats = await prisma.productProtsess.aggregate({
      where: {
        createdAt: {
          ...(parsedStartDate && { gte: parsedStartDate }),
          ...(parsedEndDate && { lte: parsedEndDate }),
        },
      },
      _sum: {
        sendedCount: true,
        invalidCount: true,
        acceptCount: true,
      },
    });

    const overallTotalCount = await prisma.invoice.aggregate({
      where: dateFilter,
      _sum: { totalCount: true },
    });

    const overallSendedCount = overallStats._sum.sendedCount || 0;
    const overallInvalidCount = overallStats._sum.invalidCount || 0;
    const overallAcceptCount = overallStats._sum.acceptCount || 0;
    const overallResidueCount =
      overallAcceptCount - (overallSendedCount + overallInvalidCount);

    const uniqueDepartments = await prisma.invoice.findMany({
      where: dateFilter,
      distinct: ["department"],
      select: { department: true },
    });

    const formattedProductPackStats = await Promise.all(
      uniqueDepartments.map(async ({ department }) => {
        const invoicesInDepartment = await prisma.invoice.findMany({
          where: { department, ...dateFilter },
          select: { id: true, totalCount: true },
        });

        const totalCount = invoicesInDepartment.reduce(
          (sum, invoice) => sum + (invoice.totalCount || 0),
          0
        );

        const invoiceIds = invoicesInDepartment.map((invoice) => invoice.id);

        const processStats = await prisma.productProtsess.aggregate({
          where: {
            invoiceId: { in: invoiceIds },
            createdAt: {
              ...(parsedStartDate && { gte: parsedStartDate }),
              ...(parsedEndDate && { lte: parsedEndDate }),
            },
          },
          _sum: { sendedCount: true, invalidCount: true, acceptCount: true },
        });

        const sendedCount = processStats._sum.sendedCount || 0;
        const invalidCount = processStats._sum.invalidCount || 0;
        const acceptCount = processStats._sum.acceptCount || 0;
        const residueCount = acceptCount - (sendedCount + invalidCount);

        return {
          id: department,
          name: department,
          department,
          totalCount,
          protsessIsOver: acceptCount === sendedCount + invalidCount,
          sendedCount,
          invalidCount,
          acceptCount,
          residueCount,
        };
      })
    );

    return {
      totalProductPacks,
      overallStats: {
        sendedCount: overallSendedCount,
        invalidCount: overallInvalidCount,
        acceptCount: overallAcceptCount,
        residueCount: overallResidueCount,
      },
      productPackStats: formattedProductPackStats,
      dateRange: {
        startDate: parsedStartDate ? parsedStartDate.toISOString() : null,
        endDate: parsedEndDate ? parsedEndDate.toISOString() : null,
      },
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  } finally {
    await prisma.$disconnect();
  }
};

// New service for getProductPackStats
export const getProductPackStatsService = async (
  invoiceId: string
): Promise<any> => {
  try {
    // Validate invoice ID
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Check if invoice exists
    const invoiceExists = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoiceExists) {
      throw new Error("Invoice not found");
    }

    // Get aggregated stats for ProductProtsess
    const stats = await prisma.productProtsess.aggregate({
      where: { invoiceId },
      _sum: {
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
      },
    });

    // Get individual process records
    const processes = await prisma.productProtsess.findMany({
      where: { invoiceId },
      select: {
        id: true,
        date: true,
        status: true,
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
        invalidReason: true,
        department: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Get invoice details
    const invoiceDetails = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        number: true,
        department: true,
        totalCount: true,
        protsessIsOver: true,
        productGroup: {
          select: {
            name: true,
            products: {
              select: {
                name: true,
                productSetting: {
                  select: {
                    totalCount: true,
                    sizeGroups: {
                      select: {
                        size: true,
                        quantity: true,
                        colorSizes: {
                          select: {
                            quantity: true,
                            color: { select: { name: true } },
                            size: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      details: invoiceDetails,
      stats: {
        sendedCount: stats._sum.sendedCount || 0,
        invalidCount: stats._sum.invalidCount || 0,
        residueCount: stats._sum.residueCount || 0,
        acceptCount: stats._sum.acceptCount || 0,
      },
      processes,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  } finally {
    await prisma.$disconnect();
  }
};

// New service for getAllModelCounts
export const getAllModelCountsService = async (): Promise<any> => {
  try {
    // Get counts for all models
    const [
      colorCount,
      sizeCount,
      departmentCount,
      employeeCount,
      userCount,
      invoiceCount,
      productCount,
      productProtsessCount,
    ] = await Promise.all([
      prisma.color.count(),
      prisma.size.count(),
      prisma.department.count(),
      prisma.employee.count(),
      prisma.user.count(),
      prisma.invoice.count(),
      prisma.product.count(),
      prisma.productProtsess.count(),
    ]);

    // Get user count by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    const userRoleCounts = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Get top colors by ProductColorSize count
    const topColors = await prisma.color.findMany({
      include: { _count: { select: { colorSizes: true } } },
      orderBy: { colorSizes: { _count: "desc" } },
      take: 5,
    });

    // Get top sizes by ProductColorSize count
    const topSizes = await prisma.size.findMany({
      include: { _count: { select: { colorSizes: true } } },
      orderBy: { colorSizes: { _count: "desc" } },
      take: 5,
    });

    // Get department stats
    const departmentStats = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true, processes: true } },
      },
    });

    // Calculate process completion percentage for each department
    const departmentProcessStats = await Promise.all(
      departmentStats.map(async (dept) => {
        const totalProcesses = await prisma.productProtsess.count({
          where: { departmentId: dept.id },
        });

        const completedProcesses = await prisma.productProtsess.count({
          where: { departmentId: dept.id, protsessIsOver: true },
        });

        const completionPercentage =
          totalProcesses > 0
            ? Math.round((completedProcesses / totalProcesses) * 100)
            : 0;

        return {
          id: dept.id,
          name: dept.name,
          employeeCount: dept._count.employees,
          processCount: dept._count.processes,
          completedProcesses,
          completionPercentage,
        };
      })
    );

    // Get top product groups
    const topProductGroups = await prisma.productGroup.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { products: { _count: "desc" } },
      take: 10,
    });

    return {
      basicCounts: {
        colors: colorCount,
        sizes: sizeCount,
        departments: departmentCount,
        employees: employeeCount,
        users: userCount,
        invoices: invoiceCount,
        products: productCount,
        processes: productProtsessCount,
      },
      detailedStats: {
        usersByRole: userRoleCounts,
        topColors: topColors.map((color) => ({
          id: color.id,
          name: color.name,
          productColorSizeCount: color._count.colorSizes,
        })),
        topSizes: topSizes.map((size) => ({
          id: size.id,
          name: size.name,
          productColorSizeCount: size._count.colorSizes,
        })),
        departmentStats: departmentProcessStats,
        topProductGroups: topProductGroups.map((pg) => ({
          groupName: pg.name,
          productCount: pg._count.products,
        })),
      },
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  } finally {
    await prisma.$disconnect();
  }
};

// New service for getEmployeeStats
export const getEmployeeStatsService = async (
  employeeId: string
): Promise<any> => {
  try {
    // Validate employee ID
    if (!employeeId) {
      throw new Error("Employee ID is required");
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Get unique invoice IDs from ProductProtsess
    const employeeProcesses = await prisma.productProtsess.findMany({
      where: { employeeId },
      select: { invoiceId: true },
      distinct: ["invoiceId"],
    });

    const invoiceIds = employeeProcesses.map((process) => process.invoiceId);

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where: { id: { in: invoiceIds } },
      select: {
        id: true,
        number: true,
        totalCount: true,
        protsessIsOver: true,
        department: true,
        productGroup: { select: { name: true } },
      },
    });

    // Get aggregated stats
    const stats = await prisma.productProtsess.aggregate({
      where: { employeeId },
      _sum: {
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
      },
    });

    // Get detailed process records
    const processes = await prisma.productProtsess.findMany({
      where: { employeeId },
      select: {
        id: true,
        date: true,
        status: true,
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
        invalidReason: true,
        department: { select: { name: true } },
        invoice: { select: { number: true } },
      },
      orderBy: { date: "desc" },
    });

    // Calculate total product count
    const totalProductCount = invoices.reduce(
      (sum, invoice) => sum + (invoice.totalCount || 0),
      0
    );

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department.name,
      },
      totalProductCount,
      productPackCount: invoices.length,
      stats: {
        sendedCount: stats._sum.sendedCount || 0,
        invalidCount: stats._sum.invalidCount || 0,
        residueCount: stats._sum.residueCount || 0,
        acceptCount: stats._sum.acceptCount || 0,
      },
      productPacks: invoices,
      processes,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  } finally {
    await prisma.$disconnect();
  }
};
