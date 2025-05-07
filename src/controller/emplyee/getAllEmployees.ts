// src/controllers/employeeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        login: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json(employees);
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
