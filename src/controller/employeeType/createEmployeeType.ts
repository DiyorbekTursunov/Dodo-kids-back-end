import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new employee type
export const createEmployeeType = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const newType = await prisma.department.create({ data: { name } });
      return res.status(201).json(newType);
    } catch (error) {
      console.error("Create employee type error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
