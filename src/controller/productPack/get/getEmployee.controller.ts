import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get product packs by employee ID
export const getProductPacksByEmployeeId = async (
  req: Request,
  res: Response
) => {
  const { employeeId } = req.params;

  try {
    // Verify if the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Find all ProductProtsess records for this employee
    const productProcesses = await prisma.productProtsess.findMany({
      where: {
        employeeId,
      },
      select: {
        invoiceId: true,
      },
      distinct: ["invoiceId"], // Get unique product pack IDs
    });

    // Get the unique product pack IDs, filtering out null values
    const productPackIds = productProcesses
      .map((process) => process.invoiceId)
      .filter((id): id is string => id !== null); // Ensure only non-null strings

    // If no valid product pack IDs, return empty response
    if (productPackIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Fetch all product packs with their details
    const productPacks = await prisma.invoice.findMany({
      where: {
        id: {
          in: productPackIds, // Now typed as string[]
        },
      },
      include: {
        productGroup: {
          include: {
            products: true,
          },
        },
        status: {
          orderBy: {
            date: "desc",
          },
          take: 1, // Get only the latest status
        },
      },
    });

    // Format the response to include the latest status
    const formattedPacks = productPacks.map((pack) => ({
      ...pack,
      latestStatus: pack.status[0] || null,
      status: undefined, // Remove the status array from response
    }));

    return res.status(200).json({
      success: true,
      count: formattedPacks.length,
      data: formattedPacks,
    });
  } catch (error) {
    console.error("Error fetching product packs by employee ID:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
