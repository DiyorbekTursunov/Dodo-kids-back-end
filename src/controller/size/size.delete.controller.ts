import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete Size
export const deleteSize = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await prisma.size.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Size not found" });

    await prisma.size.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting size:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
