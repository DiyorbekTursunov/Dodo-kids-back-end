import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params; // User ID

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return res.status(500).json({ error: "Failed to fetch employee" });
  }
};
