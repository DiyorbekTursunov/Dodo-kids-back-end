// src/controllers/employeeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { encodePassword } from "../../lib/jwtPasswordUtils";

const prisma = new PrismaClient();

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { login, password, typeId } = req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Check if typeId is valid when provided
    if (typeId) {
      const employeeType = await prisma.department.findUnique({
        where: { id: typeId },
      });

      if (!employeeType) {
        return res.status(400).json({ error: "Invalid employee type ID" });
      }
    }

    const updateData: any = {};
    if (login) updateData.login = login;
    if (typeId) updateData.typeId = typeId;
    if (password) {
      updateData.password = encodePassword(password);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
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

    return res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Update employee error:", error);
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
