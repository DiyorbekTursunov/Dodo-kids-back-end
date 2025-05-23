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
    model: string; // Adjusted: Using ProductGroup.name as a proxy since Product has no model
    createdAt: Date;
    updatedAt: Date;
    color?: { id: string; name: string }[];
    size?: { id: string; name: string }[];
  };
  totalCount: number;
  isSent: boolean;
  status: string;
  processedStatus: string;
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
  includePending?: boolean | undefined;
  colorId?: string | undefined;
  sizeId?: string | undefined;
}

/**
 * Extract filter parameters from request (both query and body)
 * Safely handles undefined values
 */
function extractCaseTrackerFilterParams(req: Request): CaseTrackerFilterParams {
  const safeGetValue = (key: string): string | undefined => {
    return (req.query[key] as string | undefined) ||
           (req.body && req.body[key] ? req.body[key] as string : undefined);
  };

  const getSearchName = (): string | undefined => {
    return safeGetValue("search") ||
           safeGetValue("searchName") ||
           safeGetValue("name");
  };

  const getIncludePending = (): boolean => {
    const includePendingParam = safeGetValue("includePending");
    if (includePendingParam === "false") return false;
    if (includePendingParam === "0") return false;
    return true;
  };

  return {
    startDate: safeGetValue("startDate"),
    endDate: safeGetValue("endDate"),
    searchName: getSearchName(),
    departmentId: safeGetValue("departmentId"),
    status: safeGetValue("status"),
    includePending: getIncludePending(),
    colorId: safeGetValue("colorId"),
    sizeId: safeGetValue("sizeId"),
  };
}

/**
 * Get case tracker status for invoices with filtering options
 * Returns status information grouped by parentIds
 * Supports filtering by date range, name/model search, department, status, color, and size
 */
export const getCaseTrackerStatus = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const filters = extractCaseTrackerFilterParams(req);

    console.log("Case tracker filter inputs:", filters);

    // Build the filter for the Prisma query
    const queryFilter: any = {};

    // Parse and apply date filters correctly
    if (filters.startDate || filters.endDate) {
      queryFilter.createdAt = {};

      if (filters.startDate) {
        try {
          const parsedStartDate = new Date(filters.startDate);
          if (!isNaN(parsedStartDate.getTime())) {
            queryFilter.createdAt.gte = parsedStartDate;
            console.log("Applying start date filter:", parsedStartDate);
          } else {
            console.error("Invalid start date format:", filters.startDate);
          }
        } catch (e) {
          console.error("Error parsing start date:", e);
        }
      }

      if (filters.endDate) {
        try {
          const parsedEndDate = new Date(filters.endDate);
          if (!isNaN(parsedEndDate.getTime())) {
            parsedEndDate.setHours(23, 59, 59, 999);
            queryFilter.createdAt.lte = parsedEndDate;
            console.log("Applying end date filter:", parsedEndDate);
          } else {
            console.error("Invalid end date format:", filters.endDate);
          }
        } catch (e) {
          console.error("Error parsing end date:", e);
        }
      }
    }

    // Apply department filter
    if (filters.departmentId) {
      queryFilter.departmentId = filters.departmentId;
    }

    // Apply color and size filtering logic
    if (filters.colorId || filters.sizeId) {
      queryFilter.ProductGroup = {
        ...(queryFilter.ProductGroup || {}),
        products: {
          some: {
            productSetting: {
              sizeGroups: {
                some: {},
              },
            },
          },
        },
      };

      if (filters.colorId) {
        queryFilter.ProductGroup.products.some.productSetting.sizeGroups.some.colorSizes = {
          some: {
            colorId: filters.colorId,
          },
        };
      }

      if (filters.sizeId) {
        queryFilter.ProductGroup.products.some.productSetting.sizeGroups.some.colorSizes = {
          some: {
            sizeId: filters.sizeId,
          },
        };
      }
    }

    // Apply name search filter for both product name and model
    if (filters.searchName) {
      const searchTerm = filters.searchName.trim();

      if (searchTerm) {
        const searchConditions = {
          OR: [
            {
              number: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
            {
              ProductGroup: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        };

        if (Object.keys(queryFilter).length > 0) {
          queryFilter.AND = queryFilter.AND || [];
          queryFilter.AND.push(searchConditions);
        } else {
          Object.assign(queryFilter, searchConditions);
        }
      }
    }

    console.log("Final Prisma query filter:", JSON.stringify(queryFilter, null, 2));

    // Get invoices with applied filters and their latest status
    const invoices = await prisma.invoice.findMany({
      where: queryFilter,
      include: {
        ProductGroup: {
          select: {
            id: true,
            name: true,
            products: {
              select: {
                id: true,
                name: true,
                createdAt: true, // Added to resolve TypeScript error
                updatedAt: true, // Added to resolve TypeScript error
                productSetting: {
                  select: {
                    totalCount: true,
                    sizeGroups: {
                      select: {
                        size: true,
                        quantity: true,
                        colorSizes: {
                          select: {
                            quantity: true,
                            color: {
                              select: {
                                id: true,
                                name: true,
                              },
                            },
                            size: {
                              select: {
                                id: true,
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
        status: {
          orderBy: {
            date: "desc",
          },
          take: 1, // Get only the latest status
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Raw invoices count:", invoices.length);
    if (invoices.length > 0) {
      console.log(
        "Sample invoice ProductGroup data:",
        invoices[0].ProductGroup
          ? JSON.stringify(invoices[0].ProductGroup, null, 2)
          : "No ProductGroup data"
      );
    }

    // Format individual invoices
    let formattedPacks = invoices.map((invoice) => {
      const latestStatus = invoice.status[0] || null;
      const rawStatus = latestStatus?.status || "";

      let processedStatus = rawStatus;

      const specialStatuses = ["Pending", "Qabul qilingan", "To'liq yuborilmagan", "Yuborilgan"];

      if (!specialStatuses.includes(rawStatus) && latestStatus) {
        if (latestStatus.sendedCount < latestStatus.acceptCount) {
          processedStatus = "To'liq yuborilmagan";
        } else {
          processedStatus = "Yuborilgan";
        }
      }

      return {
        id: invoice.id,
        name: invoice.number?.toString() || null,
        department: invoice.department,
        protsessIsOver: invoice.protsessIsOver,
        perentId: invoice.perentId,
        Product: {
          id: invoice.ProductGroup.id,
          model: invoice.ProductGroup.name,
          createdAt: invoice.ProductGroup.products[0]?.createdAt || new Date(),
          updatedAt: invoice.ProductGroup.products[0]?.updatedAt || new Date(),
          color: invoice.ProductGroup.products.flatMap((p) =>
            p.productSetting.flatMap((ps) =>
              ps.sizeGroups.flatMap((sg) =>
                sg.colorSizes.map((cs) => ({
                  id: cs.color.id,
                  name: cs.color.name,
                }))
              )
            )
          ),
          size: invoice.ProductGroup.products.flatMap((p) =>
            p.productSetting.flatMap((ps) =>
              ps.sizeGroups.flatMap((sg) =>
                sg.colorSizes.map((cs) => ({
                  id: cs.size.id,
                  name: cs.size.name,
                }))
              )
            )
          ),
        },
        totalCount: invoice.totalCount,
        isSent: processedStatus === "Yuborilgan",
        status: rawStatus,
        processedStatus: processedStatus,
      };
    });

    // Apply status filter if provided (post-database filter)
    if (filters.status) {
      const status = filters.status.trim();
      formattedPacks = formattedPacks.filter(
        (p) => p.status === status || p.processedStatus === status
      );
    } else if (filters.includePending === false) {
      console.log("Excluding pending items as includePending is false");
      formattedPacks = formattedPacks.filter(
        (p) => p.status !== "Pending" && p.processedStatus !== "Pending"
      );
    } else {
      console.log(
        "Including all items (including pending) as includePending is not explicitly false"
      );
    }

    // Group by parentId with proper TypeScript typing
    const groupedByParent: GroupByParentMap = {};

    formattedPacks.forEach((pack) => {
      const parentId = pack.perentId || "";

      if (!groupedByParent[parentId]) {
        groupedByParent[parentId] = {
          perentId: parentId,
          data: [],
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
