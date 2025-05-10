import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update department
export const updateDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updated = await prisma.department.update({
      where: { id },
      data: { name },
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
