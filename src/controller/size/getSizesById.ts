// src/controllers/sizeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get size by ID
export const getSizeById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const size = await prisma.size.findUnique({
      where: { id }
    });

    if (!size) {
      return res.status(404).json({ error: "Size not found" });
    }

    return res.status(200).json(size);
  } catch (error) {
    console.error("Get size error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
