// src/controllers/colorController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete color
export const deleteColor = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existingColor = await prisma.color.findUnique({
      where: { id },
    });

    if (!existingColor) {
      return res.status(404).json({ error: "Color not found" });
    }

    await prisma.color.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete color error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
