import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create department
export const createDepartment = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Department already exists" });
    }

    const department = await prisma.department.create({ data: { name } });
    res.status(201).json(department);
  } catch (err) {
    console.error("Create Department Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
