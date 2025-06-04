import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const searchInvoices = async (req: Request, res: Response) => {
  try {
    const {
      statuses,
      productName,
      departmentId,
      page = "1",
      pageSize = "10",
    } = req.query;

    // Validate query parameters
    if (!departmentId && !productName && !statuses) {
      return res.status(400).json({
        error:
          "At least one filter (statuses, productName, or departmentId) is required",
      });
    }

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    if (isNaN(pageNum) || isNaN(size) || pageNum < 1 || size < 1) {
      return res.status(400).json({ error: "Invalid page or pageSize" });
    }

    // Parse statuses into an array
    let statusList: string[] = [];
    if (typeof statuses === "string" && statuses) {
      statusList = statuses.split(",");
    } else if (Array.isArray(statuses)) {
      statusList = statuses.map((s) => s.toString());
    }

    // Include "Yuborilgan" and "ToliqYuborilmagan" if either is present
    if (
      statusList.includes("Yuborilgan") ||
      statusList.includes("ToliqYuborilmagan")
    ) {
      statusList = [
        ...new Set([...statusList, "Yuborilgan", "ToliqYuborilmagan"]),
      ];
    }

    // Build the where clause
    const where: any = {};

    if (statusList.length > 0) {
      where.ProductProcess = {
        // Corrected from ProductProtsess to ProductProcess
        some: {
          status: {
            in: statusList, // Filter on ProductProcess.status (String field)
          },
        },
      };
    }

    if (productName) {
      where.productGroup = {
        products: {
          some: {
            name: {
              contains: productName.toString(),
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (departmentId) {
      where.departmentId = departmentId.toString();
    }

    // Calculate skip for pagination
    const skip = (pageNum - 1) * size;

    // Fetch paginated invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        productGroup: {
          include: {
            products: {
              include: {
                productSetting: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: {
                          include: {
                            size: true,
                            color: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            productGroupFiles: {
              include: {
                file: true,
              },
            },
          },
        },
        ProductProcess: true, // Correct relation name (already correct in your code)
      },
      skip,
      take: size,
    });

    // Get total count for pagination metadata
    const totalCount = await prisma.invoice.count({ where });

    if (!invoices.length) {
      return res.status(404).json({
        error: "No invoices found for the provided filters",
      });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / size);

    // Return paginated response
    res.status(200).json({
      message: "Invoices retrieved successfully",
      data: invoices,
      pagination: {
        currentPage: pageNum,
        pageSize: size,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error searching invoices:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};

export const searchProductGroups = async (req: Request, res: Response) => {
  try {
    const { name, page = "1", pageSize = "10" } = req.query;

    // Validate name parameter
    if (!name) {
      return res.status(400).json({ error: "Name parameter is required" });
    }

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    if (isNaN(pageNum) || isNaN(size) || pageNum < 1 || size < 1) {
      return res.status(400).json({ error: "Invalid page or pageSize" });
    }

    // Calculate skip for pagination
    const skip = (pageNum - 1) * size;

    // Search ProductGroups by name
    const productGroups = await prisma.productGroup.findMany({
      where: {
        name: {
          contains: name.toString(),
          mode: "insensitive",
        },
      },
      include: {
        products: {
          include: {
            productSetting: {
              include: {
                sizeGroups: {
                  include: {
                    colorSizes: {
                      include: {
                        size: true,
                        color: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        productGroupFiles: {
          include: {
            file: true,
          },
        },
      },
      skip,
      take: size,
    });

    // Get total count for pagination metadata
    const totalCount = await prisma.productGroup.count({
      where: {
        name: {
          contains: name.toString(),
          mode: "insensitive",
        },
      },
    });

    if (!productGroups.length) {
      return res.status(404).json({
        error: "No product groups found for the provided name",
      });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / size);

    // Return paginated response
    res.status(200).json({
      message: "Product groups retrieved successfully",
      data: productGroups,
      pagination: {
        currentPage: pageNum,
        pageSize: size,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error searching product groups:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};
