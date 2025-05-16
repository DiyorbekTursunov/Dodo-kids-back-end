import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define interfaces for our data structures
interface FormattedProductPack {
  id: string;
  name: string | null;
  department: string;
  protsessIsOver: boolean;
  perentId?: string;
  Product: {
    id: string;
    model: string;
    createdAt: Date;
    updatedAt: Date;
  };
  totalCount: number;
  isSent: boolean;
  status: string;
  processedStatus: string; // Added to match the product packs filter
}

interface GroupedProductPacks {
  perentId: string;
  data: FormattedProductPack[];
}

// Define a type for our grouping object
interface GroupByParentMap {
  [parentId: string]: GroupedProductPacks;
}

// Type definition for case tracker filter parameters
interface CaseTrackerFilterParams {
  startDate?: string | undefined;
  endDate?: string | undefined;
  searchName?: string | undefined;
  departmentId?: string | undefined;
  status?: string | undefined;
  includePending?: boolean | undefined; // New parameter to control Pending items
}

/**
 * Extract filter parameters from request (both query and body)
 * Safely handles undefined values
 */
function extractCaseTrackerFilterParams(req: Request): CaseTrackerFilterParams {
  // Safely get value from request
  const safeGetValue = (key: string): string | undefined => {
    return (req.query[key] as string | undefined) ||
           (req.body && req.body[key] ? req.body[key] as string : undefined);
  };

  // Get search name from multiple possible keys
  const getSearchName = (): string | undefined => {
    return safeGetValue('search') ||
           safeGetValue('searchName') ||
           safeGetValue('name');
  };

  // Get includePending parameter with a default value
  const getIncludePending = (): boolean => {
    const includePendingParam = safeGetValue('includePending');
    if (includePendingParam === 'true') return true;
    if (includePendingParam === '1') return true;
    return false;
  };

  return {
    startDate: safeGetValue('startDate'),
    endDate: safeGetValue('endDate'),
    searchName: getSearchName(),
    departmentId: safeGetValue('departmentId'),
    status: safeGetValue('status'),
    includePending: getIncludePending()
  };
}

/**
 * Get case tracker status for product packs with filtering options
 * Returns status information grouped by parentIds
 * Supports filtering by date range, name/model search, department and status
 */
export const getCaseTrackerStatus = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const filters = extractCaseTrackerFilterParams(req);

    console.log('Case tracker filter inputs:', filters);

    // Build the filter for the Prisma query
    const queryFilter: any = {};

    // Parse and apply date filters only if they exist
    if (filters.startDate) {
      try {
        const parsedStartDate = new Date(filters.startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          if (!queryFilter.createdAt) queryFilter.createdAt = {};
          queryFilter.createdAt.gte = parsedStartDate;
        } else {
          console.error('Invalid start date format:', filters.startDate);
        }
      } catch (e) {
        console.error('Error parsing start date:', e);
      }
    }

    if (filters.endDate) {
      try {
        const parsedEndDate = new Date(filters.endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          // Add one day to include the entire end date
          parsedEndDate.setHours(23, 59, 59, 999);
          if (!queryFilter.createdAt) queryFilter.createdAt = {};
          queryFilter.createdAt.lte = parsedEndDate;
        } else {
          console.error('Invalid end date format:', filters.endDate);
        }
      } catch (e) {
        console.error('Error parsing end date:', e);
      }
    }

    // Apply department filter
    if (filters.departmentId) {
      queryFilter.departmentId = filters.departmentId;
    }

    // Apply name search filter for both product name and model
    if (filters.searchName) {
      queryFilter.OR = [
        {
          name: {
            contains: filters.searchName,
            mode: "insensitive" as const
          }
        },
        {
          Product: {
            model: {
              contains: filters.searchName,
              mode: "insensitive" as const
            }
          }
        }
      ];
    }

    // Get product packs with applied filters and their latest status
    const productPacks = await prisma.productPack.findMany({
      where: queryFilter,
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
          // Include all status records to have complete info
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format individual product packs
    let formattedPacks = productPacks.map(pack => {
      // Get the latest status entry
      const latestStatus = pack.status.length > 0 ? pack.status[0] : null;
      const rawStatus = latestStatus?.status || "";

      // Check if the status field already contains processed values like "To'liq yuborilmagan"
      // or if we need to calculate them
      let processedStatus = rawStatus;

      // Special statuses that might need processing
      const specialStatuses = ["Pending", "Qabul qilingan", "To'liq yuborilmagan", "Yuborilgan"];

      // If the status isn't already one of our special processed values, calculate it
      if (!specialStatuses.includes(rawStatus) && latestStatus) {
        // Apply original logic to calculate processedStatus
        if (latestStatus.sendedCount < latestStatus.acceptCount) {
          processedStatus = "To'liq yuborilmagan";
        } else {
          processedStatus = "Yuborilgan";
        }
      }

      // Debug log to help diagnose status issues
      console.log(`Processing pack ${pack.id}:`, {
        rawStatus,
        processedStatus,
        sendedCount: latestStatus?.sendedCount,
        acceptCount: latestStatus?.acceptCount
      });

      return {
        id: pack.id,
        name: pack.name,
        department: pack.department,
        protsessIsOver: pack.protsessIsOver,
        perentId: pack.perentId,
        Product: {
          id: pack.Product.id,
          model: pack.Product.model,
          createdAt: pack.Product.createdAt,
          updatedAt: pack.Product.updatedAt
        },
        totalCount: pack.totalCount,
        isSent: processedStatus === "Yuborilgan",
        status: rawStatus,
        processedStatus: processedStatus,
      };
    });

    // Apply status filter if provided (post-database filter)
    if (filters.status) {
      // Handle both raw status and processed status in filtering
      const filterStatus = filters.status;
      formattedPacks = formattedPacks.filter(pack =>
        pack.status === filterStatus || pack.processedStatus === filterStatus
      );
    } else if (!filters.includePending) {
      // If includePending is false and no specific status is requested,
      // exclude Pending status by default
      formattedPacks = formattedPacks.filter(pack =>
        pack.status !== "Pending" && pack.processedStatus !== "Pending"
      );
    }
    // If includePending is true or a specific status is requested, don't filter out pending

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
