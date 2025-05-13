import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Search products by model name and filter by status
 */
export const searchProductsByModel = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.query as string || "";
    const statusFilter = req.query.status as string | undefined;

    // Find product packs associated with products matching the search term
    const productPacks = await prisma.productPack.findMany({
      where: {
        Product: {
          model: {
            contains: searchTerm,
            mode: "insensitive" as const,
          }
        }
      },
      include: {
        Product: {
          include: {
            color: true,
            size: true,
          }
        },
        status: true,
      },
    });

    // Process status information for each product pack
    const processedProductPacks = productPacks.map(pack => {
      // Find the latest status entry for this product pack
      const latestStatus = pack.status.length > 0
        ? pack.status.reduce((latest, current) =>
            new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
          )
        : null;

      // Map status values as required
      let statusValue = "";
      if (latestStatus) {
        if (latestStatus.status === "Pending") {
          statusValue = "Pending";
        } else if (latestStatus.status === "Qabul qilingan") {
          statusValue = "Qabul qilingan";
        } else if (latestStatus.sendedCount < latestStatus.acceptCount) {
          statusValue = "To'liq yuborilmagan";
        } else {
          statusValue = "Yuborilgan";
        }
      }

      return {
        ...pack,
        processedStatus: statusValue
      };
    });

    // First filter out "Pending" status items
    let filteredProductPacks = processedProductPacks.filter(pack =>
      pack.processedStatus !== "Pending"
    );

    // Then apply the status filter if provided
    if (statusFilter) {
      filteredProductPacks = filteredProductPacks.filter(pack =>
        pack.processedStatus === statusFilter
      );
    }

    return res.status(200).json({
      data: filteredProductPacks
    });

  } catch (error) {
    console.error("Error searching product packs:", error);
    return res.status(500).json({
      error: "Failed to search product packs",
      details: (error as Error).message
    });
  }
};
