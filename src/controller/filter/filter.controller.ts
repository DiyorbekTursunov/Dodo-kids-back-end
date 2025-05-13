import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type definitions for filter parameters
type FilterParams = {
  name?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

/**
 * Get colors with filtering options
 */
export const getColors = async (req: Request, res: Response) => {
  try {
    const filters = extractFilterParams(req);
    const skip = (filters.page - 1) * filters.pageSize;

    // Create filter condition
    const where = filters.name ? {
      name: {
        contains: filters.name,
        mode: "insensitive" as const,
      },
    } : {};

    // Get total count for pagination
    const totalCount = await prisma.color.count({ where });

    // Get data with filters
    const colors = await prisma.color.findMany({
      where,
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip,
      take: filters.pageSize,
    });

    return res.status(200).json({
      data: colors,
      pagination: {
        total: totalCount,
        page: filters.page,
        pageSize: filters.pageSize,
        pageCount: Math.ceil(totalCount / filters.pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching colors:", error);
    return res.status(500).json({ error: "Failed to fetch colors" });
  }
};

/**
 * Get sizes with filtering options
 */
export const getSizes = async (req: Request, res: Response) => {
  try {
    const filters = extractFilterParams(req);
    const skip = (filters.page - 1) * filters.pageSize;

    // Create filter condition
    const where = filters.name ? {
      name: {
        contains: filters.name,
        mode: "insensitive" as const,
      },
    } : {};

    // Get total count for pagination
    const totalCount = await prisma.size.count({ where });

    // Get data with filters
    const sizes = await prisma.size.findMany({
      where,
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip,
      take: filters.pageSize,
    });

    return res.status(200).json({
      data: sizes,
      pagination: {
        total: totalCount,
        page: filters.page,
        pageSize: filters.pageSize,
        pageCount: Math.ceil(totalCount / filters.pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return res.status(500).json({ error: "Failed to fetch sizes" });
  }
};

/**
 * Get departments with filtering options
 */
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const filters = extractFilterParams(req);
    const skip = (filters.page - 1) * filters.pageSize;

    // Create filter condition
    const where = filters.name ? {
      name: {
        contains: filters.name,
        mode: "insensitive" as const,
      },
    } : {};

    // Get total count for pagination
    const totalCount = await prisma.department.count({ where });

    // Get data with filters
    const departments = await prisma.department.findMany({
      where,
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip,
      take: filters.pageSize,
      include: {
        _count: {
          select: {
            Employee: true,
            ProductProtsess: true,
          },
        },
      },
    });

    return res.status(200).json({
      data: departments,
      pagination: {
        total: totalCount,
        page: filters.page,
        pageSize: filters.pageSize,
        pageCount: Math.ceil(totalCount / filters.pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ error: "Failed to fetch departments" });
  }
};

/**
 * Helper function to extract filter parameters from request
 */
function extractFilterParams(req: Request): FilterParams {
  return {
    name: req.query.name as string || undefined,
    sortBy: (req.query.sortBy as string) || "createdAt",
    sortOrder: ((req.query.sortOrder as "asc" | "desc") || "desc"),
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
  };
}
