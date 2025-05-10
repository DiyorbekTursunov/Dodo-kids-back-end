import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create Size
export const createSize = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const existing = await prisma.size.findUnique({ where: { name } });
    if (existing) return res.status(409).json({ error: "Size already exists" });

    const size = await prisma.size.create({ data: { name } });
    res.status(201).json(size);
  } catch (err) {
    console.error("Error creating size:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
