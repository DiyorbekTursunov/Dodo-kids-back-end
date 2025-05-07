// src/controllers/sizeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all sizes
export const getAllSizes = async (req: Request, res: Response) => {
  try {
    const sizes = await prisma.size.findMany();
    return res.status(200).json(sizes);
  } catch (error) {
    console.error("Get sizes error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
