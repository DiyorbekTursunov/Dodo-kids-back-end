import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const departmentOrderMap: Record<string, { logicalId: number; allowedNext: string[] }> = {
  bichuv: { logicalId: 1, allowedNext: ["tasnif"] },
  tasnif: { logicalId: 2, allowedNext: ["pechat", "pechatusluga"] },
  pechat: { logicalId: 3, allowedNext: ["vishivka", "vishivkausluga"] },
  pechatusluga: { logicalId: 3, allowedNext: ["vishivka", "vishivkausluga"] },
  vishivka: { logicalId: 4, allowedNext: ["tikuv", "tikuvusluga"] },
  vishivkausluga: { logicalId: 4, allowedNext: ["tikuv", "tikuvusluga"] },
  tikuv: { logicalId: 5, allowedNext: ["chistka"] },
  tikuvusluga: { logicalId: 5, allowedNext: ["chistka"] },
  chistka: { logicalId: 6, allowedNext: ["kontrol"] },
  kontrol: { logicalId: 7, allowedNext: ["dazmol"] },
  dazmol: { logicalId: 8, allowedNext: ["upakovka"] },
  upakovka: { logicalId: 9, allowedNext: ["ombor"] },
  ombor: { logicalId: 10, allowedNext: [] },
};

const normalizeDepartment = (name: string): string => {
  const map: Record<string, string> = {
    autsorspechat: "pechat",
    autsorstikuv: "tikuv",
    pechatusluga: "pechatusluga",
    vishivkausluga: "vishivkausluga",
    tikuvusluga: "tikuvusluga",
  };
  return map[name.toLowerCase()] || name.toLowerCase();
};

// Filter parameters interface
interface CaseTrackerFilterParams {
  startDate?: string;
  endDate?: string;
  searchName?: string;
  departmentId?: string;
  logicalId?: number;
  status?: string;
  includePending?: boolean;
  colorId?: string;
  sizeId?: string;
  isOutsourseCompany?: boolean;
  sortBy?: "createdAt" | "totalCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// Raw data interface from Prisma
interface RawProductPack {
  id: string;
  department: string;
  protsessIsOver: boolean;
  perentId: string;
  totalCount: number;
  productGroup: {
    id: string;
    name: string;
    products: {
      productSetting: {
        sizeGroups: {
          colorSizes: {
            color: { id: string; name: string };
            size: { id: string; name: string };
          }[];
        }[];
      }[];
    }[];
  };
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
    isOutsourseCompany: boolean;
    outsourseCompanyId: string | null;
    outsourseName: string | null;
  }[];
}

// Formatted data interface
interface FormattedProductPack {
  id: string;
  department: string;
  logicalId: number;
  protsessIsOver: boolean;
  perentId: string;
  ProductGroup: {
    id: string;
    name: string;
    colors: { id: string; name: string }[];
    sizes: { id: string; name: string }[];
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
  statusDate: string;
  isOutsourseCompany: boolean;
  outsourseCompanyId: string | null;
  outsourseName: string | null;
}

// Consolidated data interface
interface ConsolidatedProductPack {
  id: string;
  department: string;
  logicalId: number;
  protsessIsOver: boolean;
  perentId: string;
  ProductGroup: {
    id: string;
    name: string;
    colors: { id: string; name: string }[];
    sizes: { id: string; name: string }[];
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
  isOutsourseCompany: boolean;
  outsourseCompanyId: string | null;
  outsourseName: string | null;
}

// Extract and validate filter parameters
function extractCaseTrackerFilterParams(req: Request): CaseTrackerFilterParams {
  const safeGetValue = (key: string): string | undefined =>
    req.query[key] as string | undefined || (req.body && req.body[key] ? String(req.body[key]) : undefined);

  return {
    startDate: safeGetValue("startDate"),
    endDate: safeGetValue("endDate"),
    searchName: safeGetValue("searchName") || safeGetValue("search") || safeGetValue("name") || safeGetValue("productName"),
    departmentId: safeGetValue("departmentId"),
    logicalId: safeGetValue("logicalId") ? parseInt(safeGetValue("logicalId")!) : undefined,
    status: safeGetValue("status"),
    includePending: safeGetValue("includePending") !== "false" && safeGetValue("includePending") !== "0",
    colorId: safeGetValue("colorId"),
    sizeId: safeGetValue("sizeId"),
    isOutsourseCompany: safeGetValue("isOutsourseCompany") !== undefined ? safeGetValue("isOutsourseCompany") === "true" : undefined,
    sortBy: (safeGetValue("sortBy") as "createdAt" | "totalCount") || "createdAt",
    sortOrder: (safeGetValue("sortOrder") as "asc" | "desc") || "desc",
    page: safeGetValue("page") ? parseInt(safeGetValue("page")!) : 1,
    pageSize: safeGetValue("pageSize") ? parseInt(safeGetValue("pageSize")!) : 10,
  };
}

// Build Prisma query filter
function buildQueryFilter(filters: CaseTrackerFilterParams): any {
  const queryFilter: any = {};

  // Date filters
  if (filters.startDate || filters.endDate) {
    queryFilter.createdAt = {};
    if (filters.startDate) {
      const parsedStartDate = new Date(filters.startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        queryFilter.createdAt.gte = parsedStartDate;
      }
    }
    if (filters.endDate) {
      const parsedEndDate = new Date(filters.endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        parsedEndDate.setHours(23, 59, 59, 999);
        queryFilter.createdAt.lte = parsedEndDate;
      }
    }
  }

  // Department filter
  if (filters.departmentId) {
    queryFilter.departmentId = filters.departmentId;
  }

  // Logical ID filter
  if (filters.logicalId) {
    const deptNames = Object.entries(departmentOrderMap)
      .filter(([_, config]) => config.logicalId === filters.logicalId)
      .map(([name]) => name);
    if (deptNames.length === 0) {
      throw new Error(`No departments found for logicalId: ${filters.logicalId}`);
    }
    queryFilter.department = { in: deptNames, mode: "insensitive" };
  }

  // Color and size filtering
  if (filters.colorId || filters.sizeId) {
    queryFilter.productGroup = {
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

  // Name search filter
  if (filters.searchName?.trim()) {
    const searchTerm = filters.searchName.trim();
    queryFilter.OR = [
      { number: { contains: searchTerm, mode: "insensitive" } },
      { productGroup: { name: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  // Status filter
  if (filters.status && filters.includePending) {
    queryFilter.status = { some: { status: filters.status } };
  } else if (!filters.includePending) {
    queryFilter.status = { some: { status: { not: "Pending" } } };
  }

  // Outsourcing filter
  if (filters.isOutsourseCompany !== undefined) {
    queryFilter.status = {
      ...queryFilter.status,
      some: { isOutsourseCompany: filters.isOutsourseCompany },
    };
  }

  return queryFilter;
}

// Format invoice data
function formatInvoiceData(pack: RawProductPack): FormattedProductPack {
  const latestProcess = pack.status[0];
  const sendedCount = latestProcess ? latestProcess.sendedCount : 0;
  const acceptCount = latestProcess ? latestProcess.acceptCount : 0;
  const residueCount = latestProcess ? latestProcess.residueCount : 0;
  const status = latestProcess ? latestProcess.status : "Pending";
  const statusDate = latestProcess ? latestProcess.date.toISOString() : new Date(0).toISOString();
  const isSent = status === "Yuborilgan";
  const isOutsourseCompany = latestProcess ? latestProcess.isOutsourseCompany : false;
  const outsourseCompanyId = latestProcess ? latestProcess.outsourseCompanyId : null;
  const outsourseName = latestProcess ? latestProcess.outsourseName : null;
  const normalizedDept = normalizeDepartment(pack.department);
  const logicalId = departmentOrderMap[normalizedDept]?.logicalId || 0;

  // Extract unique colors and sizes
  const colorsSet = new Set<string>();
  const sizesSet = new Set<string>();
  const colors: { id: string; name: string }[] = [];
  const sizes: { id: string; name: string }[] = [];

  pack.productGroup?.products?.forEach((product) => {
    product.productSetting?.forEach((ps) => {
      ps.sizeGroups?.forEach((sg) => {
        sg.colorSizes?.forEach((cs) => {
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
    id: pack.id,
    department: pack.department,
    logicalId,
    protsessIsOver: pack.protsessIsOver,
    perentId: pack.perentId,
    ProductGroup: {
      id: pack.productGroup.id,
      name: pack.productGroup.name,
      colors,
      sizes,
    },
    totalCount: pack.totalCount,
    sendedCount,
    acceptCount,
    residueCount,
    isSent,
    status,
    statusDate,
    isOutsourseCompany,
    outsourseCompanyId,
    outsourseName,
  };
}

// Consolidate and group packs
function consolidateAndGroupPacks(formattedPacks: FormattedProductPack[]): { perentId: string; data: ConsolidatedProductPack[] }[] {
  const consolidatedMap: Map<string, FormattedProductPack> = new Map();

  formattedPacks.forEach((pack) => {
    const key = `${pack.perentId}-${normalizeDepartment(pack.department)}`;
    if (!consolidatedMap.has(key)) {
      consolidatedMap.set(key, pack);
    } else {
      const existing = consolidatedMap.get(key)!;
      if (new Date(pack.statusDate) > new Date(existing.statusDate)) {
        consolidatedMap.set(key, pack);
      }
    }
  });

  const consolidatedPacksArray: ConsolidatedProductPack[] = Array.from(consolidatedMap.values())
    .sort((a, b) => a.logicalId - b.logicalId)
    .map((pack) => ({
      id: pack.id,
      department: pack.department,
      logicalId: pack.logicalId,
      protsessIsOver: pack.protsessIsOver,
      perentId: pack.perentId,
      ProductGroup: pack.ProductGroup,
      totalCount: pack.totalCount,
      sendedCount: pack.sendedCount,
      acceptCount: pack.acceptCount,
      residueCount: pack.residueCount,
      isSent: pack.isSent,
      status: pack.status,
      isOutsourseCompany: pack.isOutsourseCompany,
      outsourseCompanyId: pack.outsourseCompanyId,
      outsourseName: pack.outsourseName,
    }));

  const groupedByParentId: { [parentId: string]: ConsolidatedProductPack[] } = {};
  consolidatedPacksArray.forEach((pack) => {
    if (!groupedByParentId[pack.perentId]) {
      groupedByParentId[pack.perentId] = [];
    }
    groupedByParentId[pack.perentId].push(pack);
  });

  return Object.entries(groupedByParentId).map(([perentId, data]) => ({
    perentId,
    data,
  }));
}

export const getCaseTrackerStatus = async (req: Request, res: Response) => {
  try {
    const filters = extractCaseTrackerFilterParams(req);
    const queryFilter = buildQueryFilter(filters);

    // Calculate pagination
    const skip = (filters.page! - 1) * filters.pageSize!;
    const totalCount = await prisma.invoice.count({ where: queryFilter });

    // Fetch invoices
    const productPacks = await prisma.invoice.findMany({
      where: queryFilter,
      select: {
        id: true,
        department: true,
        protsessIsOver: true,
        perentId: true,
        totalCount: true,
        productGroup: {
          select: {
            id: true,
            name: true,
            products: {
              select: {
                productSetting: {
                  select: {
                    sizeGroups: {
                      select: {
                        colorSizes: {
                          select: {
                            color: { select: { id: true, name: true } },
                            size: { select: { id: true, name: true } },
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
          orderBy: { date: "desc" },
          take: 1,
          select: {
            id: true,
            date: true,
            protsessIsOver: true,
            status: true,
            acceptCount: true,
            sendedCount: true,
            invalidCount: true,
            residueCount: true,
            invalidReason: true,
            isOutsourseCompany: true,
            outsourseCompanyId: true,
            outsourseName: true,
          },
        },
      },
      orderBy: { [filters.sortBy!]: filters.sortOrder! },
      skip,
      take: filters.pageSize!,
    });

    // Format packs
    const formattedPacks: FormattedProductPack[] = productPacks.map(formatInvoiceData);

    // Consolidate and group
    const responseData = consolidateAndGroupPacks(formattedPacks);

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / filters.pageSize!);
    const hasNextPage = filters.page! < totalPages;
    const hasPrevPage = filters.page! > 1;

    return res.status(200).json({
      success: true,
      count: responseData.length,
      totalCount,
      data: responseData,
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
