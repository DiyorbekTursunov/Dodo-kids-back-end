import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete an employee type
export const deleteEmployeeType = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedType = await prisma.department.delete({ where: { id } });
      return res.status(200).json(deletedType);
    } catch (error) {
      console.error("Delete employee type error:", error);
      return res.status(404).json({ error: "Not found" });
    }
  };
