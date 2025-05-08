import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllProductsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all products if no department filter is provided
    // Fetch all MainProtsess with related Line data
    const products = await prisma.mainProtsess.findMany({
      include: {
        line: true, // Include related lines for each MainProtsess
      },
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};
