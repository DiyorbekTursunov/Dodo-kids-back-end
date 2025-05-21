import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all Product Packs
export const getAllProductPacks = async (_req: Request, res: Response) => {
  try {
    const productPacks = await prisma.invoice.findMany({
      include: {
        Product: true,
        status: true,
      },
    });

    res.status(200).json(productPacks);
  } catch (err) {
    console.error("Error fetching Product Packs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
