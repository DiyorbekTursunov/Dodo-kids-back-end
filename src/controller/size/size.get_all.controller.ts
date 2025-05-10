import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all Sizes
export const getSizes = async (_: Request, res: Response) => {
  try {
    const sizes = await prisma.size.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(sizes);
  } catch (err) {
    console.error("Error fetching sizes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
