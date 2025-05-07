
// src/controllers/employeeController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
