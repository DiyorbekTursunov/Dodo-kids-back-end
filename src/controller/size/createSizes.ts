// src/controllers/sizeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create new size
export const createSize = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const size = await prisma.size.create({
      data: {
        name
      }
    });

    return res.status(201).json(size);
  } catch (error) {
    console.error("Create size error:", error);
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
