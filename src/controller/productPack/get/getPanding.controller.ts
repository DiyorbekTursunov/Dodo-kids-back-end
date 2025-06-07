import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPendingProductPacks = async (req: Request, res: Response) => {
  const { departmentId, page = "1", pageSize = "10" } = req.query;

  if (!departmentId) {
    return res.status(400).json({ error: "Department ID is required" });
  }

  const pageNum = parseInt(page as string, 10);
  const size = parseInt(pageSize as string, 10);

  if (isNaN(pageNum) || isNaN(size) || pageNum < 1 || size < 1) {
    return res.status(400).json({ error: "Invalid page or pageSize" });
  }

  try {
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: String(departmentId) },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Calculate skip value for pagination
    const skip = (pageNum - 1) * size;

    // Fetch paginated product packs with status "Pending"
    const productPacks = await prisma.invoice.findMany({
      where: {
        departmentId: String(departmentId),
        status: {
          some: {
            status: "Pending",
          },
        },
      },
      include: {
        status: {
          where: { status: "Pending" },
          orderBy: { date: "desc" },
        },
        productGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
            products: {
              include: {
                productSettings: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: {
                          include: {
                            sizeGroup: {
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
                  },
                },
              },
            },
          },
        },
      },
      skip,
      take: size,
    });

    // Get total count for pagination metadata
    const totalCount = await prisma.invoice.count({
      where: {
        departmentId: String(departmentId),
        status: {
          some: {
            status: "Pending",
          },
        },
      },
    });

    if (!productPacks.length) {
      return res.status(404).json({
        error: "No pending product packs found for this department with the pagination",
      });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / size);

    // Return paginated response
    res.status(200).json({
      message: "Pending product packs retrieved successfully",
      data: productPacks,
      pagination: {
        currentPage: pageNum,
        pageSize: size,
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching pending product packs:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
