import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      include: {
        Employee: true,
      },
    });

    return res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
};
