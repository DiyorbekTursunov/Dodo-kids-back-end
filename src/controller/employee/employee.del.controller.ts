import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params; // User ID

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }, // Minimal select for existence check
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.deleteMany({
        where: { userId: id },
      });
      await tx.user.delete({
        where: { id },
      });
    });

    return res.status(200).json({ message: "User and associated employee deleted" });
  } catch (error) {
    console.error("Error deleting user and employee:", error);
    return res.status(500).json({ error: "Failed to delete user and employee" });
  }
};
