import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all departments
export const getDepartments = async (_: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(departments);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
