import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define interfaces for our data structures
interface RawProductPack {
  id: string;
  name: string | null;
  department: string;
  protsessIsOver: boolean;
  perentId: string;
  Product: {
    id: string;
    model: string; // Added model field to match schema
    createdAt: Date;
    updatedAt: Date;
  };
  totalCount: number;
  status: {
    id: string;
    date: Date;
    protsessIsOver: boolean;
    status: string;
    acceptCount: number;
    sendedCount: number;
    invalidCount: number;
    residueCount: number;
    invalidReason: string;
  }[];
}

interface FormattedProductPack {
  id: string;
  name: string | null;
  department: string;
  protsessIsOver: boolean;
  perentId: string;
  Product: {
    id: string;
    model: string;
    createdAt: Date;
    updatedAt: Date;
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
}

interface ConsolidatedProductPack {
  id: string;
  name: string | null;
  department: string;
  protsessIsOver: boolean;
  perentId: string;
  Product: {
    id: string;
    model: string;
    createdAt: Date;
    updatedAt: Date;
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
}

/**
 * Get consolidated case tracker status for product packs
 * Returns a summary of all product packs grouped by parentId and department to avoid duplicates
 */
export const getConsolidatedCaseTrackerStatus = async (
  req: Request,
  res: Response
) => {
  try {
    // Get all product packs with their latest status and process information
    const productPacks = await prisma.invoice.findMany({
      include: {
        ProductGroup: true, // Include all Product fields instead of selecting specific ones
        status: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    // Type assertion after we've fetched the data
    const typedProductPacks = productPacks as unknown as RawProductPack[];

    // Format all product packs
    const formattedPacks: FormattedProductPack[] = typedProductPacks.map((pack) => {
      // Get the latest status record
      const latestStatus = pack.status[0]?.status || "";

      // Calculate totals from process records
      let sendedCount = 0;
      let acceptCount = 0;
      let residueCount = 0;

      // Sum up values from all process records
      if (pack.status.length > 0) {
        sendedCount = pack.status.reduce(
          (sum, process) => sum + process.sendedCount,
          0
        );
        acceptCount = pack.status.reduce(
          (sum, process) => sum + process.acceptCount,
          0
        );
        residueCount = pack.status.reduce(
          (sum, process) => sum + process.residueCount,
          0
        );
      }

      return {
        id: pack.id,
        name: pack.name,
        department: pack.department,
        protsessIsOver: pack.protsessIsOver,
        perentId: pack.perentId,
        Product: {
          id: pack.Product.id,
          model: pack.Product.model, // Now correctly accessing model
          createdAt: pack.Product.createdAt,
          updatedAt: pack.Product.updatedAt,
        },
        totalCount: pack.totalCount,
        sendedCount: sendedCount,
        acceptCount: acceptCount,
        residueCount: residueCount,
        isSent: latestStatus === "Yuborilgan",
        status: latestStatus,
      };
    });

    // Consolidate the formatted packs by parentId AND department to eliminate duplicates
    const consolidatedMap: Map<string, ConsolidatedProductPack> = new Map();

    formattedPacks.forEach((pack) => {
      // Create a unique key combining parentId and department
      const key = `${pack.perentId}-${pack.department}`;

      if (!consolidatedMap.has(key)) {
        // First entry for this parent/department combination
        consolidatedMap.set(key, {
          id: pack.id, // Keep the first ID as reference
          name: pack.name,
          department: pack.department,
          protsessIsOver: pack.protsessIsOver,
          perentId: pack.perentId,
          Product: pack.Product,
          totalCount: pack.totalCount,
          sendedCount: pack.sendedCount,
          acceptCount: pack.acceptCount,
          residueCount: pack.residueCount,
          isSent: pack.isSent,
          status: pack.status,
        });
      } else {
        // Add counts to existing entry
        const existing = consolidatedMap.get(key)!;

        existing.totalCount += pack.totalCount;
        existing.sendedCount += pack.sendedCount;
        existing.acceptCount += pack.acceptCount;
        existing.residueCount += pack.residueCount;

        // Update process status if needed
        if (!existing.protsessIsOver) {
          existing.protsessIsOver = pack.protsessIsOver;
        }

        // If any pack is sent and the consolidated isn't already marked as sent
        if (pack.isSent && !existing.isSent) {
          existing.isSent = true;
        }

        // Update the status based on priority: Yuborilgan > Other status
        if (pack.status === "Yuborilgan" && existing.status !== "Yuborilgan") {
          existing.status = "Yuborilgan";
        }
      }
    });

    // Convert the consolidated map to an array
    const consolidatedPacksArray = Array.from(consolidatedMap.values());

    // Group by parentId for the response
    const groupedByParentId: { [parentId: string]: ConsolidatedProductPack[] } =
      {};

    consolidatedPacksArray.forEach((pack) => {
      if (!groupedByParentId[pack.perentId]) {
        groupedByParentId[pack.perentId] = [];
      }
      groupedByParentId[pack.perentId].push(pack);
    });

    // Format the response
    const responseData = Object.entries(groupedByParentId).map(
      ([perentId, data]) => ({
        perentId,
        data,
      })
    );

    // Return consolidated data
    return res.status(200).json({
      success: true,
      count: responseData.length,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching consolidated case tracker status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch consolidated case tracker status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
