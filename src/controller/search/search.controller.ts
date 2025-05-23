import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type definitions for query parameters
interface SearchProductsQuery {
  query?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}

/**
 * Search invoices by product name and filter by status
 */
export const searchProductsByModel = async (req: Request<{}, {}, {}, SearchProductsQuery>, res: Response) => {
  try {
    const searchTerm = req.query.query?.trim() || "";
    const statusFilter = req.query.status;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
      return res.status(400).json({ error: "Invalid page or pageSize" });
    }

    // Build the where clause
    const where: any = {
      ProductGroup: {
        products: {
          some: {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      },
    };

    // Apply status filter
    if (statusFilter) {
      where.status = {
        some: {
          status: statusFilter,
        },
      };
    } else {
      // Exclude "Pending" by default unless explicitly requested
      where.status = {
        some: {
          status: {
            not: "Pending",
          },
        },
      };
    }

    // Pagination setup
    const skip = (page - 1) * pageSize;

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        departmentId: true,
        department: true,
        totalCount: true,
        protsessIsOver: true,
        createdAt: true,
        updatedAt: true,
        ProductGroup: {
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
        status: {
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

    // Get total count for pagination
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
    return res.status(200).json({
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
    console.error("Error searching product packs:", {
      error,
      query: req.query,
    });
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
