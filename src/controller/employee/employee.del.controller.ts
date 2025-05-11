import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete user by ID
export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return res.status(500).json({ error: "Failed to delete employee" });
  }
};
