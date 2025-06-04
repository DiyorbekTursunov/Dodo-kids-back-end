import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface DateRange {
  startDate?: string;
  endDate?: string;
}

export const getDashboardStatsByDateRangeService = async (
  startDateInput?: string,
  endDateInput?: string
): Promise<any> => {
  try {
    // Validate and parse dates
    let parsedStartDate: Date | undefined = undefined;
    let parsedEndDate: Date | undefined = undefined;

    if (startDateInput && typeof startDateInput === "string") {
      parsedStartDate = new Date(startDateInput);
      if (isNaN(parsedStartDate.getTime())) {
        throw new Error("Invalid startDate format");
      }
    }

    if (endDateInput && typeof endDateInput === "string") {
      parsedEndDate = new Date(endDateInput);
      if (isNaN(parsedEndDate.getTime())) {
        throw new Error("Invalid endDate format");
      }
      parsedEndDate.setHours(23, 59, 59, 999); // Include entire end date
    }

    // Require at least one valid date
    if (!parsedStartDate && !parsedEndDate) {
      throw new Error("At least one valid date (startDate or endDate) must be provided");
    }

    // Construct date filter for invoices and processes
    const dateFilter: Prisma.InvoiceWhereInput = {
      createdAt: {
        ...(parsedStartDate && { gte: parsedStartDate }),
        ...(parsedEndDate && { lte: parsedEndDate }),
      },
    };

    // Get total invoice count within date range
    const totalProductPacks = await prisma.invoice.count({
      where: dateFilter,
    });

    // Get overall stats for ProductProtsess within date range
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

    // Get sum of totalCount from Invoices within date range
    const overallTotalCount = await prisma.invoice.aggregate({
      where: dateFilter,
      _sum: {
        totalCount: true,
      },
    });

    // Calculate overall residueCount
    const overallSendedCount = overallStats._sum.sendedCount || 0;
    const overallInvalidCount = overallStats._sum.invalidCount || 0;
    const overallAcceptCount = overallStats._sum.acceptCount || 0;
    const overallResidueCount = overallAcceptCount - (overallSendedCount + overallInvalidCount);

    // Get unique departments from Invoices within date range
    const uniqueDepartments = await prisma.invoice.findMany({
      where: dateFilter,
      distinct: ["department"],
      select: {
        department: true,
      },
    });

    // Get stats aggregated by department
    const formattedProductPackStats = await Promise.all(
      uniqueDepartments.map(async ({ department }) => {
        // Get invoices for this department within date range
        const invoicesInDepartment = await prisma.invoice.findMany({
          where: {
            department,
            ...dateFilter,
          },
          select: {
            id: true,
            totalCount: true,
          },
        });

        // Sum up totalCount for all invoices in this department
        const totalCount = invoicesInDepartment.reduce(
          (sum, invoice) => sum + (invoice.totalCount || 0),
          0
        );

        // Get invoice IDs
        const invoiceIds = invoicesInDepartment.map((invoice) => invoice.id);

        // Aggregate stats for ProductProtsess within date range
        const processStats = await prisma.productProtsess.aggregate({
          where: {
            invoiceId: {
              in: invoiceIds,
            },
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

        // Calculate residueCount for this department
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

    // Construct the response
    const dashboardData = {
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

    return dashboardData;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  } finally {
    await prisma.$disconnect();
  }
};
