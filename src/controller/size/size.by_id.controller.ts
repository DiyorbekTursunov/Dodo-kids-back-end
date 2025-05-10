import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get one Size by ID
export const getSizeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const size = await prisma.size.findUnique({ where: { id } });
    if (!size) return res.status(404).json({ error: "Size not found" });
    res.status(200).json(size);
  } catch (err) {
    console.error("Error fetching size:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
