import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSentProductPacks = async (req: Request, res: Response) => {
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
    // Calculate skip value for pagination
    const skip = (pageNum - 1) * size;

    // Fetch paginated product packs
    const productPacks = await prisma.invoice.findMany({
      where: {
        departmentId: String(departmentId),
        status: {
          some: {
            status: {
              in: ["Yuborilgan", "To'liq yuborilmagan"],
            },
          },
        },
      },
      include: {
        status: true,
        ProductGroup: true,
      },
      skip, // Number of records to skip
      take: size, // Number of records to take
    });

    // Get total count for pagination metadata
    const totalCount = await prisma.invoice.count({
      where: {
        departmentId: String(departmentId),
        status: {
          some: {
            status: {
              in: ["Yuborilgan", "To'liq yuborilmagan"],
            },
          },
        },
      },
    });

    if (!productPacks.length) {
      return res.status(404).json({ error: "No product packs found for this department with the pagenation" });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / size);

    // Return paginated response
    res.status(200).json({
      message: "Product packs retrieved successfully",
      data: productPacks,
      pagination: {
        currentPage: pageNum,
        pageSize: size,
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching product packs:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
