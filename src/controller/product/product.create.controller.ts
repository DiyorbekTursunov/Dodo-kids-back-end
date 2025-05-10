import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create product with associated colors and sizes
export const createProduct = async (req: Request, res: Response) => {
  const { model, colorIds, sizeIds } = req.body;

  try {
    // Input validation
    if (!model) {
      return res.status(400).json({ error: "Product model is requireddddd" });
    }

    if (!colorIds || !Array.isArray(colorIds) || colorIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one color ID is required" });
    }

    if (!sizeIds || !Array.isArray(sizeIds) || sizeIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one size ID is required" });
    }

    // Create product with relations
    const product = await prisma.product.create({
      data: {
        model,
        color: {
          connect: colorIds.map((id) => ({ id })),
        },
        size: {
          connect: sizeIds.map((id) => ({ id })),
        },
      },
      include: {
        color: true,
        size: true,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
};
