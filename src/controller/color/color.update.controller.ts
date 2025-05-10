import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update color
export const updateColor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const updated = await prisma.color.update({
      where: { id },
      data: { name },
    });
    res.status(200).json(updated);
  } catch (err) {
    console.error("Update Color Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
