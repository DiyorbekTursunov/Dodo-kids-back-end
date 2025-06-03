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
  ProductGroup: {
    id: string;
    name: string;
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
  ProductGroup: {
    id: string;
    name: string;
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
  statusDate: Date; // Included for comparison during consolidation
}

interface ConsolidatedProductPack {
  id: string;
  name: string | null;
  department: string;
  protsessIsOver: boolean;
  perentId: string;
  ProductGroup: {
    id: string;
    name: string;
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
 * Returns a summary of all product packs grouped by perentId with the latest status per department
 */
export const getConsolidatedCaseTrackerStatus = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch all invoices with only the latest status record
    const productPacks = await prisma.invoice.findMany({
      include: {
        productGroup: true,
        status: {
          orderBy: {
            date: "desc",
          },
          take: 1, // Fetch only the latest status per invoice
        },
      },
    });

    // Type assertion for fetched data
    const typedProductPacks = productPacks as unknown as RawProductPack[];

    // Format packs using the latest status
    const formattedPacks: FormattedProductPack[] = typedProductPacks.map((pack) => {
      const latestProcess = pack.status[0];
      const sendedCount = latestProcess ? latestProcess.sendedCount : 0;
      const acceptCount = latestProcess ? latestProcess.acceptCount : 0;
      const residueCount = latestProcess ? latestProcess.residueCount : 0;
      const status = latestProcess ? latestProcess.status : "";
      const statusDate = latestProcess ? latestProcess.date : new Date(0);
      const isSent = status === "Yuborilgan";

      return {
        id: pack.id,
        name: pack.name,
        department: pack.department,
        protsessIsOver: pack.protsessIsOver,
        perentId: pack.perentId,
        ProductGroup: pack.ProductGroup,
        totalCount: pack.totalCount,
        sendedCount,
        acceptCount,
        residueCount,
        isSent,
        status,
        statusDate, // Include date for consolidation comparison
      };
    });

    // Consolidate the formatted packs by perentId and department, keeping only the latest entry
    const consolidatedMap: Map<string, FormattedProductPack> = new Map();

    formattedPacks.forEach((pack) => {
      const key = `${pack.perentId}-${pack.department}`;
      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, pack);
      } else {
        const existing = consolidatedMap.get(key)!;
        if (pack.statusDate > existing.statusDate) {
          consolidatedMap.set(key, pack);
        }
      }
    });

    // Convert the map to an array of ConsolidatedProductPack (excluding statusDate)
    const consolidatedPacksArray: ConsolidatedProductPack[] = Array.from(consolidatedMap.values()).map(pack => ({
      id: pack.id,
      name: pack.name,
      department: pack.department,
      protsessIsOver: pack.protsessIsOver,
      perentId: pack.perentId,
      ProductGroup: pack.ProductGroup,
      totalCount: pack.totalCount,
      sendedCount: pack.sendedCount,
      acceptCount: pack.acceptCount,
      residueCount: pack.residueCount,
      isSent: pack.isSent,
      status: pack.status,
    }));

    // Group by perentId for the response
    const groupedByParentId: { [parentId: string]: ConsolidatedProductPack[] } = {};

    consolidatedPacksArray.forEach((pack) => {
      if (!groupedByParentId[pack.perentId]) {
        groupedByParentId[pack.perentId] = [];
      }
      groupedByParentId[pack.perentId].push(pack);
    });

    // Format the response
    const responseData = Object.entries(groupedByParentId).map(([perentId, data]) => ({
      perentId,
      data,
    }));

    // Return the consolidated data
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
