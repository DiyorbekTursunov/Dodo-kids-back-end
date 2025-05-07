// src/controllers/sizeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update size
export const updateSize = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "At least one field (name) is required" });
    }

    const existingSize = await prisma.size.findUnique({
      where: { id }
    });

    if (!existingSize) {
      return res.status(404).json({ error: "Size not found" });
    }

    const updateData: any = {};
    if (name) updateData.name = name;

    const updatedSize = await prisma.size.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json(updatedSize);
  } catch (error) {
    console.error("Update size error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res
        .status(409)
        .json({ error: "Size with this name already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
