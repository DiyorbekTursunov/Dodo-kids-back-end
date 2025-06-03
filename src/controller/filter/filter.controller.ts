import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type definitions for filter parameters
type ProductPackFilterParams = {
  colorId?: string;
  sizeId?: string;
  departmentId?: string;
  productName?: string;
  status?: string;
  sortBy: "createdAt" | "totalCount";
  sortOrder: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Get invoices with filtering options by color, size, department, product name, status, and date range
 */
export const getFilteredProductPacks = async (req: Request, res: Response) => {
  try {
    const filters = extractProductPackFilterParams(req);

    // Build the where clause for filtering
    const where: any = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.productName) {
      where.ProductGroup = {
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
      where.ProductGroup = {
        ...where.ProductGroup,
        products: {
          some: {
            productSetting: {
              some: {
                sizeGroups: { // Fixed: Changed SizeGroup to sizeGroups
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
      // Exclude "Pending" status by default unless explicitly requested
      where.status = {
        some: {
          status: {
            not: "Pending",
          },
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
                    sizeGroups: { // Fixed: Changed SizeGroup to sizeGroups
                      select: {
                        id: true,
                        size: true,
                        quantity: true,
                        colorSizes: {
                          select: {
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
        status: { // Correctly reference ProductProtsess relation
          orderBy: {
            updatedAt: "desc",
          },
          take: 1, // Fetch only the latest status
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
    const processedInvoices = invoices.map((invoice) => {
      const latestStatus = invoice.status[0]; // Latest status (if any)
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
        ...invoice,
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

/**
 * Helper function to extract and validate filter parameters from request
 */
function extractProductPackFilterParams(req: Request): ProductPackFilterParams {
  return {
    colorId: req.query.colorId as string | undefined,
    sizeId: req.query.sizeId as string | undefined,
    departmentId: req.query.departmentId as string | undefined,
    productName: req.query.productName as string | undefined,
    status: req.query.status as string | undefined,
    sortBy: (req.query.sortBy as "createdAt" | "totalCount") || "createdAt",
    sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 10,
  };
}
