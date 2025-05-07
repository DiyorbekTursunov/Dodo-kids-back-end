// src/controllers/getAllColors.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all colors
export const getAllColors = async (req: Request, res: Response) => {
  try {
    const colors = await prisma.color.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return res.status(200).json(colors);
  } catch (error) {
    console.error("Get colors error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
