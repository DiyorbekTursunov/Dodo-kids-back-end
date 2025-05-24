import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type definitions for query parameters
interface SearchProductsQuery {
  query?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  departmentId?: string; // Add department filter
}

/**
 * Search invoices by product name and filter by status
 */
export const searchProductsByModel = async (req: Request<{}, {}, {}, SearchProductsQuery>, res: Response) => {
  try {
    const searchTerm = req.query.query?.trim() || "";
    const statusFilter = req.query.status?.trim(); // Don't convert to uppercase yet
    const departmentId = req.query.departmentId?.trim(); // Get department filter
    const page = parseInt(req.query.page || "1");
    const pageSize = parseInt(req.query.pageSize || "10");

    // Validate pagination parameters
    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
      return res.status(400).json({ error: "Invalid page or pageSize" });
    }

    // Build the where clause
    const where: any = {};

    // Apply department filter if provided
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Apply search term filter if provided
    if (searchTerm) {
      where.ProductGroup = {
        products: {
          some: {
            name: {
              contains: searchTerm.replace(/[%_]/g, "\\$&"), // Escape special characters
              mode: "insensitive",
            },
          },
        },
      };
    } else {
      // If no search term, include all invoices with a ProductGroup
      where.ProductGroup = {
        isNot: null,
      };
    }

    // Apply status filter with combined logic for "Yuborilgan" and "To'liq yuborilmagan"
    if (statusFilter && statusFilter !== "ALL") {
      const normalizedStatus = statusFilter.toLowerCase().trim();

      if (normalizedStatus === "pending") {
        where.status = {
          some: {
            status: "PENDING",
          },
        };
      } else if (normalizedStatus === "qabul qilingan") {
        where.status = {
          some: {
            status: "QABUL QILINGAN",
          },
        };
      } else if (
        normalizedStatus === "yuborilgan" ||
        normalizedStatus === "to'liq yuborilmagan" ||
        normalizedStatus === "toliq yuborilmagan" // Handle lowercase without apostrophe
      ) {
        // For both "Yuborilgan" and "To'liq yuborilmagan", we need invoices that are not PENDING and not "QABUL QILINGAN"
        // This will be filtered in post-processing since these statuses are computed based on sendedCount vs acceptCount
        where.status = {
          some: {
            status: {
              notIn: ["PENDING"],
            },
          },
        };
      } else {
        // Default: exclude "Pending" unless explicitly requested
        where.status = {
          some: {
            status: {
              not: "PENDING",
            },
          },
        };
      }
    } else {
      // Default: exclude "Pending" unless explicitly requested
      where.status = {
        some: {
          status: {
            not: "PENDING",
          },
        },
      };
    }

    // Pagination setup
    const skip = (page - 1) * pageSize;

    // Debug: Log the where clause
    console.log("Search where clause:", JSON.stringify(where, null, 2));

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        departmentId: true,
        department: true, // This is a string field, not a relation
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
          },
        },
      },
      skip,
      take: pageSize * 2, // Fetch more to account for post-filtering
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process status for display and apply additional filtering
    const processedInvoices = invoices.map((invoice) => {
      const latestStatus = invoice.status[0];
      let statusValue = "UNKNOWN";

      if (latestStatus) {
        if (latestStatus.status === "PENDING") {
          statusValue = "Pending";
        } else if (latestStatus.status === "QABUL QILINGAN") {
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

    // Apply post-processing filter for combined "Yuborilgan" and "To'liq yuborilmagan" statuses
    let filteredInvoices = processedInvoices;

    if (statusFilter && statusFilter !== "ALL") {
      const normalizedStatus = statusFilter.toLowerCase().trim();

      if (
        normalizedStatus === "yuborilgan" ||
        normalizedStatus === "to'liq yuborilmagan" ||
        normalizedStatus === "toliq yuborilmagan" // Handle lowercase without apostrophe
      ) {
        // Include both "Yuborilgan" and "To'liq yuborilmagan"
        filteredInvoices = processedInvoices.filter(invoice =>
          invoice.processedStatus === "Yuborilgan" ||
          invoice.processedStatus === "To'liq yuborilmagan"
        );
      } else if (normalizedStatus === "pending") {
        filteredInvoices = processedInvoices.filter(invoice =>
          invoice.processedStatus === "Pending"
        );
      } else if (normalizedStatus === "qabul qilingan") {
        filteredInvoices = processedInvoices.filter(invoice =>
          invoice.processedStatus === "Qabul qilingan"
        );
      }
    }

    // Apply pagination to filtered results
    const totalFilteredCount = filteredInvoices.length;
    const paginatedInvoices = filteredInvoices.slice(0, pageSize);

    // If we need more results and haven't reached the end, we might need to fetch more from DB
    // This is a simplified approach - for production, consider implementing cursor-based pagination

    const totalPages = Math.ceil(totalFilteredCount / pageSize);

    // Debug: Log the number of invoices found
    console.log(`Found ${paginatedInvoices.length} invoices after filtering, total filtered count: ${totalFilteredCount}`);

    // Return paginated response
    return res.status(200).json({
      message: "Product packs retrieved successfully",
      data: paginatedInvoices,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: totalFilteredCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
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
  } finally {
    await prisma.$disconnect();
  }
};
