import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete department
export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.department.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
