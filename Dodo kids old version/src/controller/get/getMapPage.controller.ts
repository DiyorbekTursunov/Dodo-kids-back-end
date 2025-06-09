import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define interfaces for our data structures
interface FormattedProductPack {
  id: string;
  department: string;
  protsessIsOver: boolean;
  perentId?: string; // Make this optional
  Product: {
    id: string;
    model: string;
    createdAt: Date;
    updatedAt: Date;
  };
  totalCount: number;
  isSent: boolean;
  status: string;
}

interface GroupedProductPacks {
  perentId: string;
  data: FormattedProductPack[];
}

// Define a type for our grouping object
interface GroupByParentMap {
  [parentId: string]: GroupedProductPacks;
}

/**
 * Get case tracker status for product packs
 * Returns status information grouped by parentIds
 */
export const getCaseTrackerStatus = async (req: Request, res: Response) => {
  try {
    // Get all product packs with their latest status
    const productPacks = await prisma.productPack.findMany({
      include: {
        product: {
          select: {
            id: true,
            model: true,
            createdAt: true,
            updatedAt: true
          },
        },
        processes: {
          orderBy: {
            date: "desc",
          },
          take: 1, // Get only the latest status
        },
      },
    });

    // Format individual product packs
    const formattedPacks = productPacks.map(pack => {
      const latestStatus = pack.processes[0]?.status || "";

      return {
        id: pack.id,
        department: pack.departmentName ?? "", // Ensure department is always a string
        protsessIsOver: pack.processIsOver,
        perentId: pack.parentId === null ? undefined : pack.parentId, // Ensure perentId is string or undefined
        Product: {
          id: pack.product.id,
          model: pack.product.model,
          createdAt: pack.product.createdAt,
          updatedAt: pack.product.updatedAt
        },
        totalCount: pack.totalCount,
        isSent: latestStatus === "Yuborilgan", // true if status is "Yuborilgan"
        status: latestStatus,
      };
    });

    // Group by parentId with proper TypeScript typing
    const groupedByParent: GroupByParentMap = {};

    formattedPacks.forEach(pack => {
      const parentId = pack.perentId || ""; // Use empty string if parentId is null/undefined

      if (!groupedByParent[parentId]) {
        groupedByParent[parentId] = {
          perentId: parentId,
          data: []
        };
      }

      groupedByParent[parentId].data.push(pack);
    });

    // Convert to array format
    const result = Object.values(groupedByParent);

    return res.status(200).json({
      success: true,
      count: formattedPacks.length,
      data: result,
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
