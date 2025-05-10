import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all colors
export const getColors = async (_: Request, res: Response) => {
  try {
    const colors = await prisma.color.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(colors);
  } catch (err) {
    console.error("Get Colors Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
