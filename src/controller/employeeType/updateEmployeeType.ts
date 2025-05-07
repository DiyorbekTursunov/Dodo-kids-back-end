import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update an existing employee type
export const updateEmployeeType = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const updatedType = await prisma.employeeType.update({
        where: { id },
        data: { name },
      });

      return res.status(200).json(updatedType);
    } catch (error) {
      console.error("Update employee type error:", error);
      return res.status(404).json({ error: "Not found" });
    }
  };
