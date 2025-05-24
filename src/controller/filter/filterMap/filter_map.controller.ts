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

interface GroupByParentMap {
  [parentId: string]: GroupedProductPacks;
}

// Comprehensive filter parameters interface
interface CaseTrackerFilterParams {
  startDate?: string;
  endDate?: string;
  searchName?: string;
  departmentId?: string;
  status?: string;
  includePending?: boolean;
  colorId?: string;
  sizeId?: string;
  sortBy?: "createdAt" | "totalCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/**
 * Extract and validate filter parameters from request
 */
function extractCaseTrackerFilterParams(req: Request): CaseTrackerFilterParams {
  const safeGetValue = (key: string): string | undefined => {
    return (
      (req.query[key] as string | undefined) ||
      (req.body && req.body[key] ? (req.body[key] as string) : undefined)
    );
  };

  const getSearchName = (): string | undefined => {
    return (
      safeGetValue("search") ||
      safeGetValue("searchName") ||
      safeGetValue("name") ||
      safeGetValue("productName")
    );
  };

  const getIncludePending = (): boolean => {
    const includePendingParam = safeGetValue("includePending");
    if (includePendingParam === "false" || includePendingParam === "0")
      return false;
    return true;
  };

  const getSortBy = (): "createdAt" | "totalCount" => {
    const sortBy = safeGetValue("sortBy");
    return sortBy === "totalCount" ? "totalCount" : "createdAt";
  };

  const getSortOrder = (): "asc" | "desc" => {
    const sortOrder = safeGetValue("sortOrder");
    return sortOrder === "asc" ? "asc" : "desc";
  };

  const getPage = (): number => {
    const page = parseInt(safeGetValue("page") || "1");
    return isNaN(page) || page < 1 ? 1 : page;
  };

  const getPageSize = (): number => {
    const pageSize = parseInt(safeGetValue("pageSize") || "10");
    return isNaN(pageSize) || pageSize < 1 ? 10 : Math.min(pageSize, 100); // Max 100 items per page
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
    sortBy: getSortBy(),
    sortOrder: getSortOrder(),
    page: getPage(),
    pageSize: getPageSize(),
  };
}

/**
 * Build optimized Prisma query filter
 */
function buildQueryFilter(filters: CaseTrackerFilterParams): any {
  const queryFilter: any = {};

  // Date filters
  if (filters.startDate || filters.endDate) {
    queryFilter.createdAt = {};

    if (filters.startDate) {
      try {
        const parsedStartDate = new Date(filters.startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          queryFilter.createdAt.gte = parsedStartDate;
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
        }
      } catch (e) {
        console.error("Error parsing end date:", e);
      }
    }
  }

  // Department filter
  if (filters.departmentId) {
    queryFilter.departmentId = filters.departmentId;
  }

  // Color and size filtering
  if (filters.colorId || filters.sizeId) {
    queryFilter.ProductGroup = {
      products: {
        some: {
          productSetting: {
            some: {
              sizeGroups: {
                some: {
                  colorSizes: {
                    some: {
                      ...(filters.colorId ? { colorId: filters.colorId } : {}),
                      ...(filters.sizeId ? { sizeId: filters.sizeId } : {}),
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  // Name/model search filter
  if (filters.searchName?.trim()) {
    const searchTerm = filters.searchName.trim();
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

  return queryFilter;
}

/**
 * Process status for display with business logic
 */
function processStatus(latestStatus: any): {
  rawStatus: string;
  processedStatus: string;
} {
  const rawStatus = latestStatus?.status || "";
  let processedStatus = rawStatus;

  const specialStatuses = [
    "Pending",
    "Qabul qilingan",
    "To'liq yuborilmagan",
    "Yuborilgan",
  ];

  if (!specialStatuses.includes(rawStatus) && latestStatus) {
    if (latestStatus.sendedCount < latestStatus.acceptCount) {
      processedStatus = "To'liq yuborilmagan";
    } else {
      processedStatus = "Yuborilgan";
    }
  }

  return { rawStatus, processedStatus };
}

/**
 * Format invoice data to FormattedProductPack
 */
function formatInvoiceData(invoice: any): FormattedProductPack {
  const latestStatus = invoice.status[0] || null;
  const { rawStatus, processedStatus } = processStatus(latestStatus);

  // Extract unique colors and sizes
  const colorsSet = new Set<string>();
  const sizesSet = new Set<string>();
  const colors: { id: string; name: string }[] = [];
  const sizes: { id: string; name: string }[] = [];

  invoice.ProductGroup?.products?.forEach((product: any) => {
    product.productSetting?.forEach((ps: any) => {
      ps.sizeGroups?.forEach((sg: any) => {
        sg.colorSizes?.forEach((cs: any) => {
          if (cs.color && !colorsSet.has(cs.color.id)) {
            colorsSet.add(cs.color.id);
            colors.push({ id: cs.color.id, name: cs.color.name });
          }
          if (cs.size && !sizesSet.has(cs.size.id)) {
            sizesSet.add(cs.size.id);
            sizes.push({ id: cs.size.id, name: cs.size.name });
          }
        });
      });
    });
  });

  return {
    id: invoice.id,
    name: invoice.number?.toString() || null,
    department: invoice.department,
    protsessIsOver: invoice.protsessIsOver,
    perentId: invoice.perentId,
    Product: {
      id: invoice.ProductGroup?.id || "",
      model: invoice.ProductGroup?.name || "",
      createdAt: invoice.ProductGroup?.products?.[0]?.createdAt || new Date(),
      updatedAt: invoice.ProductGroup?.products?.[0]?.updatedAt || new Date(),
      color: colors,
      size: sizes,
    },
    totalCount: invoice.totalCount,
    isSent: processedStatus === "Yuborilgan",
    status: rawStatus,
    processedStatus: processedStatus,
  };
}

/**
 * Apply post-database filters (status and pending)
 */
function applyPostDatabaseFilters(
  formattedPacks: FormattedProductPack[],
  filters: CaseTrackerFilterParams
): FormattedProductPack[] {
  let filtered = formattedPacks;

  // Apply status filter
  if (filters.status) {
    const status = filters.status.trim();
    filtered = filtered.filter(
      (p) => p.status === status || p.processedStatus === status
    );
  } else if (!filters.includePending) {
    // Exclude pending items if not explicitly included
    filtered = filtered.filter(
      (p) => p.status !== "Pending" && p.processedStatus !== "Pending"
    );
  }

  return filtered;
}

/**
 * Group formatted packs by parent ID
 */
function groupByParentId(
  formattedPacks: FormattedProductPack[]
): GroupedProductPacks[] {
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

  return Object.values(groupedByParent);
}

/**
 * Get case tracker status with optimized filtering, pagination, and grouping
 */
export const getCaseTrackerStatus = async (req: Request, res: Response) => {
  try {
    const filters = extractCaseTrackerFilterParams(req);
    console.log("Case tracker filter inputs:", filters);

    const queryFilter = buildQueryFilter(filters);
    console.log(
      "Final Prisma query filter:",
      JSON.stringify(queryFilter, null, 2)
    );

    // Calculate pagination
    const skip = (filters.page! - 1) * filters.pageSize!;

    // Get total count for pagination metadata
    const totalCount = await prisma.invoice.count({
      where: queryFilter,
    });

    // Fetch invoices with pagination
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
                createdAt: true,
                updatedAt: true,
                productSetting: true,
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
        [filters.sortBy!]: filters.sortOrder!,
      },
      skip,
      take: filters.pageSize!,
    });

    console.log("Raw invoices count:", invoices.length);

    // Format invoices
    let formattedPacks = invoices.map(formatInvoiceData);

    // Apply post-database filters
    formattedPacks = applyPostDatabaseFilters(formattedPacks, filters);

    // Group by parent ID
    const groupedResult = groupByParentId(formattedPacks);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.pageSize!);
    const hasNextPage = filters.page! < totalPages;
    const hasPrevPage = filters.page! > 1;

    return res.status(200).json({
      success: true,
      count: formattedPacks.length,
      totalCount,
      data: groupedResult,
      pagination: {
        currentPage: filters.page!,
        pageSize: filters.pageSize!,
        totalPages,
        hasNextPage,
        hasPrevPage,
        totalItems: totalCount,
      },
      filters: {
        applied: filters,
        resultsAfterFiltering: formattedPacks.length,
      },
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
