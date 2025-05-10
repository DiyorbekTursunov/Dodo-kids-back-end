import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete color
export const deleteColor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.color.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Delete Color Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
