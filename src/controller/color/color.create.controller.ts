import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new color
export const createColor = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const existing = await prisma.color.findUnique({ where: { name } });
    if (existing)
      return res.status(409).json({ error: "Color already exists" });

    const color = await prisma.color.create({ data: { name } });
    res.status(201).json(color);
  } catch (err) {
    console.error("Create Color Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
