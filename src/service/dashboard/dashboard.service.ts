import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardStatsByDateRangeService = async (
  startDateInput?: string,
  endDateInput?: string
) => {
  // Validate and parse dates
  let parsedStartDate: Date | undefined;
  let parsedEndDate: Date | undefined;

  if (startDateInput) {
    parsedStartDate = new Date(startDateInput);
    if (isNaN(parsedStartDate.getTime())) {
      throw new Error("Invalid start date format. Use YYYY-MM-DD.");
    }
    parsedStartDate.setHours(0, 0, 0, 0);
  }

  if (endDateInput) {
    parsedEndDate = new Date(endDateInput);
    if (isNaN(parsedEndDate.getTime())) {
      throw new Error("Invalid end date format. Use YYYY-MM-DD.");
    }
    parsedEndDate.setHours(23, 59, 59, 999);
  }

  if (!parsedStartDate && !parsedEndDate) {
    throw new Error("At least one valid date (startDate or endDate) must be provided");
  }

  if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
    throw new Error("startDate must be before or equal to endDate");
  }

  // Get total Invoice count (not filtered by date)
  const totalProductPacks = await prisma.invoice.count();

  // Construct date filter for Invoice
  const dateFilter = {
    createdAt: {
      ...(parsedStartDate && { gte: parsedStartDate }),
      ...(parsedEndDate && { lte: parsedEndDate }),
    },
  };

  // Get Invoices within date range
  const invoices = await prisma.invoice.findMany({
    where: dateFilter,
    orderBy: { createdAt: "desc" },
    include: {
      status: {
        orderBy: { createdAt: "desc" },
        take: 1, // Fetch only the latest status
      },
    },
  });

  // Initialize stats
  const overallStats = {
    sendedCount: 0,
    invalidCount: 0,
    acceptCount: 0,
    residueCount: 0,
  };

  // Calculate overall stats
  invoices.forEach((invoice) => {
    if (invoice.status?.[0]) {
      const latestStatus = invoice.status[0];
      overallStats.sendedCount += latestStatus.sendedCount || 0;
      overallStats.invalidCount += latestStatus.invalidCount || 0;
      overallStats.acceptCount += latestStatus.acceptCount || 0;
      overallStats.residueCount +=
        (latestStatus.acceptCount || 0) -
        ((latestStatus.sendedCount || 0) + (latestStatus.invalidCount || 0));
    }
  });

  // Ensure residueCount is non-negative
  overallStats.residueCount = Math.max(0, overallStats.residueCount);

  // Get all departments
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });

  // Get stats aggregated by department
  const formattedProductPackStats = await Promise.all(
    departments.map(async (department) => {
      const invoicesInDepartment = await prisma.invoice.findMany({
        where: {
          departmentId: department.id,
          ...dateFilter,
        },
        include: {
          status: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (invoicesInDepartment.length === 0) {
        return {
          id: department.id,
          name: department.name,
          department: department.name,
          totalCount: 0,
          protsessIsOver: false,
          sendedCount: 0,
          invalidCount: 0,
          acceptCount: 0,
          residueCount: 0,
        };
      }

      const totalCount = invoicesInDepartment.reduce(
        (sum, invoice) => sum + (invoice.totalCount || 0),
        0
      );

      let sendedCount = 0;
      let invalidCount = 0;
      let acceptCount = 0;
      let residueCount = 0;

      invoicesInDepartment.forEach((invoice) => {
        if (invoice.status?.[0]) {
          const latestStatus = invoice.status[0];
          sendedCount += latestStatus.sendedCount || 0;
          invalidCount += latestStatus.invalidCount || 0;
          acceptCount += latestStatus.acceptCount || 0;
          residueCount +=
            (latestStatus.acceptCount || 0) -
            ((latestStatus.sendedCount || 0) + (latestStatus.invalidCount || 0));
        }
      });

      residueCount = Math.max(0, residueCount);

      const protsessIsOver =
        invoicesInDepartment.length > 0 &&
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

  // Filter out departments with no data (optional, based on your response)
  const activeDepartmentStats = formattedProductPackStats.filter(
    (stat) => stat.totalCount > 0
  );

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
    usedFallbackData: false,
    overallStats,
    departmentStats: invoices.length === 0 ? [] : activeDepartmentStats,
    message:
      invoices.length === 0
        ? "No invoices found for the specified date range"
        : undefined,
  };

  return dashboardData;
};

