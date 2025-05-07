// src/controllers/employeeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        typeId: true,
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.status(200).json(employee);
  } catch (error) {
    console.error("Get employee error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
