// src/controllers/createEmployeeHandler.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { encodePassword } from "../../lib/jwtPasswordUtils";

const prisma = new PrismaClient();

export const createEmployeeHandler = async (req: Request, res: Response) => {
  try {
    const { login, password, typeId } = req.body;

    if (!login || !password || !typeId) {
      return res
        .status(400)
        .json({ error: "Login, password, and typeId are required" });
    }

    // Verify the employee type exists
    const employeeType = await prisma.employeeType.findUnique({
      where: { id: typeId },
    });

    if (!employeeType) {
      return res.status(400).json({ error: "Invalid employee type ID" });
    }

    // Create the employee
    const hashedPassword = encodePassword(password);

    const employee = await prisma.employee.create({
      data: {
        login,
        password: hashedPassword,
        typeId,
      },
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

    return res.status(201).json(employee);
  } catch (error) {
    console.error("Create employee error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res
        .status(409)
        .json({ error: "Employee with this login already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
