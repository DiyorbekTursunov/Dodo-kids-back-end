import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params; // this is the USER ID

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete both user and associated employee (if exists)
    await prisma.$transaction(async (tx) => {
      // Delete the employee if found
      await tx.employee.deleteMany({
        where: { userId: id },
      });

      // Delete the user
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
