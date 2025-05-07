// src/controllers/colorController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get color by ID
export const getColorById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const color = await prisma.color.findUnique({
      where: { id },
    });

    if (!color) {
      return res.status(404).json({ error: "Color not found" });
    }

    return res.status(200).json(color);
  } catch (error) {
    console.error("Get color error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
