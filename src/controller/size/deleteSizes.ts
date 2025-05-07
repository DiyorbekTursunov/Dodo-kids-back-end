// src/controllers/sizeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete size
export const deleteSize = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existingSize = await prisma.size.findUnique({
      where: { id }
    });

    if (!existingSize) {
      return res.status(404).json({ error: "Size not found" });
    }

    await prisma.size.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete size error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
