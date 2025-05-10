import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update Size
export const updateSize = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const existing = await prisma.size.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Size not found" });

    const updated = await prisma.size.update({ where: { id }, data: { name } });
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating size:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
