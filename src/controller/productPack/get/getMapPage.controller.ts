import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get case tracker status for product packs
 * Returns status information with isSent flag and Product details
 */
export const getCaseTrackerStatus = async (req: Request, res: Response) => {
  try {
    // Get all product packs with their latest status
    const productPacks = await prisma.productPack.findMany({
      include: {
        Product: {
          select: {
            id: true,
            model: true,
            createdAt: true,
            updatedAt: true
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

    // Format the response for the case tracker
    const formattedData = productPacks.map(pack => {
      const latestStatus = pack.status[0]?.status || "";

      return {
        id: pack.id,
        name: pack.name,
        department: pack.department,
        protsessIsOver: pack.protsessIsOver,
        Product: {
          id: pack.Product.id,
          model: pack.Product.model,
          createdAt: pack.Product.createdAt,
          updatedAt: pack.Product.updatedAt
        },
        totalCount: pack.totalCount,
        isSent: latestStatus === "Yuborilgan", // true if status is "Yuborilgan"
        status: latestStatus,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching case tracker status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch case tracker status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
