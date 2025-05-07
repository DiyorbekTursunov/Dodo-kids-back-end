// src/controllers/colorController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update color
export const updateColor = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ error: "At least one field (name or hexCode) is required" });
    }

    const existingColor = await prisma.color.findUnique({
      where: { id },
    });

    if (!existingColor) {
      return res.status(404).json({ error: "Color not found" });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    
    const updatedColor = await prisma.color.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedColor);
  } catch (error) {
    console.error("Update color error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res
        .status(409)
        .json({ error: "Color with this name already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
