// src/controllers/colorController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create new color
export const createColor = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }


    const color = await prisma.color.create({
      data: {
        name,
      },
    });

    return res.status(201).json(color);
  } catch (error) {
    console.error("Create color error:", error);
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
