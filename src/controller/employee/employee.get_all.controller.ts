import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      select: {
        id: true,
        login: true,
        role: true,
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
};
