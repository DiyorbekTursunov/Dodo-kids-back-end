import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get color by ID
export const getColorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const color = await prisma.color.findUnique({ where: { id } });
    if (!color) return res.status(404).json({ error: "Color not found" });
    res.status(200).json(color);
  } catch (err) {
    console.error("Get Color By ID Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
