import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Department order map with logical IDs
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

// Type definitions for filter parameters
type ProductPackFilterParams = {
  colorId?: string;
  sizeId?: string;
  departmentId?: string;
  logicalId?: number; // Added for logical ID filtering
  productName?: string;
  status?: string;
  isOutsourseCompany?: boolean; // Added for outsourcing filter
  sortBy: "createdAt" | "totalCount";
  sortOrder: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

// Response type for processed invoices
interface ProcessedInvoice {
  id: string;
  number: number;
  departmentId: string;
  department: string;
  logicalId: number; // Added logical ID
  totalCount: number;
  protsessIsOver: boolean;
  createdAt: Date;
  updatedAt: Date;
  productGroup: {
    id: string;
    name: string;
    products: {
      id: string;
      name: string;
      allTotalCount: number;
      productSetting: {
        id: string;
        totalCount: number;
        sizeGroups: {
          id: string;
          size: string;
          quantity: number;
          colorSizes: {
            color: { id: string; name: string };
            size: { id: string; name: string };
            quantity: number;
          }[];
        }[];
      }[];
    }[];
  };
  status: {
    id: string;
    status: string;
    date: Date;
    employeeId: string;
    departmentName: string;
    targetDepartment: string | null;
    acceptCount: number;
    sendedCount: number;
    invalidCount: number;
    residueCount: number;
    invalidReason: string;
    isOutsourseCompany: boolean; // Added outsourcing fields
    outsourseCompanyId: string | null;
    outsourseName: string | null;
  }[];
  processedStatus: string;
}

export const getFilteredProductPacks = async (req: Request, res: Response) => {
  try {
    const filters = extractProductPackFilterParams(req);

    // Build the where clause for filtering
    const where: any = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.logicalId) {
      // Map logicalId to department names
      const deptNames = Object.entries(departmentOrderMap)
        .filter(([_, config]) => config.logicalId === filters.logicalId)
        .map(([name]) => name);
      if (deptNames.length === 0) {
        throw new Error(`No departments found for logicalId: ${filters.logicalId}`);
      }
      where.department = { in: deptNames, mode: "insensitive" };
    }

    if (filters.productName) {
      where.productGroup = {
        products: {
          some: {
            name: {
              contains: filters.productName,
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (filters.colorId || filters.sizeId) {
      where.productGroup = {
        ...where.productGroup,
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

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (isNaN(startDate.getTime())) {
          throw new Error("Invalid startDate format");
        }
        where.createdAt.gte = startDate;
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (isNaN(endDate.getTime())) {
          throw new Error("Invalid endDate format");
        }
        where.createdAt.lte = endDate;
      }
    }

    if (filters.status) {
      where.status = {
        some: {
          status: filters.status,
        },
      };
    } else {
      where.status = {
        some: {
          status: { not: "Pending" },
        },
      };
    }

    if (filters.isOutsourseCompany !== undefined) {
      where.status = {
        ...where.status,
        some: {
          isOutsourseCompany: filters.isOutsourseCompany,
        },
      };
    }

    // Pagination setup
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // Fetch filtered invoices
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      select: {
        id: true,
        number: true,
        departmentId: true,
        department: true,
        totalCount: true,
        protsessIsOver: true,
        createdAt: true,
        updatedAt: true,
        productGroup: {
          select: {
            id: true,
            name: true,
            products: {
              select: {
                id: true,
                name: true,
                allTotalCount: true,
                productSetting: {
                  select: {
                    id: true,
                    totalCount: true,
                    sizeGroups: {
                      select: {
                        id: true,
                        size: true,
                        quantity: true,
                        colorSizes: {
                          select: {
                            color: {
                              select: { id: true, name: true },
                            },
                            size: {
                              select: { id: true, name: true },
                            },
                            quantity: true,
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
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            date: true,
            employeeId: true,
            departmentName: true,
            targetDepartment: true,
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
      skip,
      take: pageSize,
    });

    // Get total count for pagination metadata
    const totalCount = await prisma.invoice.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    // Process status for display
    const processedInvoices: ProcessedInvoice[] = invoices.map((invoice) => {
      const latestStatus = invoice.status[0];
      let statusValue = "";
      const normalizedDept = normalizeDepartment(invoice.department);
      const logicalId = departmentOrderMap[normalizedDept]?.logicalId || 0;

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
        ...invoice,
        logicalId,
        processedStatus: statusValue,
      };
    });

    // Return paginated response
    res.status(200).json({
      message: "Product packs retrieved successfully",
      data: processedInvoices,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered product packs:", {
      error,
      filters: req.query,
    });
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

function extractProductPackFilterParams(req: Request): ProductPackFilterParams {
  return {
    colorId: req.query.colorId as string | undefined,
    sizeId: req.query.sizeId as string | undefined,
    departmentId: req.query.departmentId as string | undefined,
    logicalId: req.query.logicalId ? parseInt(req.query.logicalId as string) : undefined,
    productName: req.query.productName as string | undefined,
    status: req.query.status as string | undefined,
    isOutsourseCompany:
      req.query.isOutsourseCompany !== undefined
        ? req.query.isOutsourseCompany === "true"
        : undefined,
    sortBy: (req.query.sortBy as "createdAt" | "totalCount") || "createdAt",
    sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
  };
}
