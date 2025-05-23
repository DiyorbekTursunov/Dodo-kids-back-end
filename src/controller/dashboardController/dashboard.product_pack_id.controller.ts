import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get detailed stats for a specific Invoice
export const getProductPackStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the Invoice exists
    const invoiceExists = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoiceExists) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Get aggregated stats for this Invoice
    const stats = await prisma.productProtsess.aggregate({
      where: {
        invoiceId: id,
      },
      _sum: {
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
      },
    });

    // Get individual process records for this Invoice
    const processes = await prisma.productProtsess.findMany({
      where: {
        invoiceId: id,
      },
      select: {
        id: true,
        date: true,
        status: true,
        sendedCount: true,
        invalidCount: true,
        residueCount: true,
        acceptCount: true,
        invalidReason: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Get invoice details (adjusted to reflect correct relations)
    const invoiceDetails = await prisma.invoice.findUnique({
      where: { id },
      select: {
        number: true, // Adjusted: Using 'number' instead of 'name' as per schema
        department: true,
        totalCount: true,
        protsessIsOver: true,
        ProductGroup: {
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
                        colorSizes: { // Corrected: Accessed via sizeGroups
                          select: {
                            quantity: true,
                            color: {
                              select: {
                                name: true,
                              },
                            },
                            size: {
                              select: {
                                name: true,
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
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        details: invoiceDetails,
        stats: {
          sendedCount: stats._sum.sendedCount || 0,
          invalidCount: stats._sum.invalidCount || 0,
          residueCount: stats._sum.residueCount || 0,
          acceptCount: stats._sum.acceptCount || 0,
        },
        processes,
      },
    });
  } catch (error) {
    console.error("Error fetching Invoice stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Invoice statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
