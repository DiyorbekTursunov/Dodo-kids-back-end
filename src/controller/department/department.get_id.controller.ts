import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get department by ID
export const getDepartmentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.status(200).json(department);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
