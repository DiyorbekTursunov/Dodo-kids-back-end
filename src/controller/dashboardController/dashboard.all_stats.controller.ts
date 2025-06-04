import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dashboard Controller
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get all Invoice count (replacing productPack)
    const totalProductPacks = await prisma.invoice.count(); // Fixed: Using invoice instead of productPack

    // Get overall stats
    const overallStats = await prisma.productProtsess.aggregate({
      _sum: {
        sendedCount: true,
        invalidCount: true,
        acceptCount: true,
      },
    });

    // Get sum of all totalCount from Invoices for overall count
    const overallTotalCount = await prisma.invoice.aggregate({
      _sum: {
        totalCount: true,
      },
    });

    // Calculate overall residueCount using the new formula
    const overallSendedCount = overallStats._sum.sendedCount || 0;
    const overallInvalidCount = overallStats._sum.invalidCount || 0;
    const overallAcceptCount = overallStats._sum.acceptCount || 0;
    const overallResidueCount = overallAcceptCount - (overallSendedCount + overallInvalidCount);

    // Get all unique departments from Invoices
    const uniqueDepartments = await prisma.invoice.findMany({
      distinct: ["department"],
      select: {
        department: true,
      },
    });

    // Get stats aggregated by department
    const formattedProductPackStats = await Promise.all(
      uniqueDepartments.map(async ({ department }) => {
        // Get all Invoices for this department
        const invoicesInDepartment = await prisma.invoice.findMany({
          where: {
            department,
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

        // Get the IDs of all Invoices in this department
        const invoiceIds = invoicesInDepartment.map((invoice) => invoice.id);

        // Aggregate stats for all Invoices in this department
        const processStats = await prisma.productProtsess.aggregate({
          where: {
            invoiceId: {
              in: invoiceIds, // Fixed: Changed productpackId to invoiceId
            },
          },
          _sum: {
            sendedCount: true,
            invalidCount: true,
            acceptCount: true,
          },
        });

        // Calculate residueCount for this department using the new formula
        const sendedCount = processStats._sum.sendedCount || 0;
        const invalidCount = processStats._sum.invalidCount || 0;
        const acceptCount = processStats._sum.acceptCount || 0;
        const residueCount = acceptCount - (sendedCount + invalidCount);

        return {
          id: department, // Using department as the ID for grouping
          name: department, // Using department name as the display name
          department,
          totalCount,
          // Process is over when acceptCount equals the sum of sendedCount and invalidCount
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
      productPackStats: formattedProductPackStats, // Renamed for clarity, though keeping original key
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

// New service for getEmployeeStats
export const getEmployeeStatsService = async (employeeId: string): Promise<any> => {
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
