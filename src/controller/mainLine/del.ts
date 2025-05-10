import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteAllMainProtsess = async (req: Request, res: Response) => {
  try {
    // Delete in the correct order to respect foreign key constraints

    // First delete Status records (they depend on Line)
    await prisma.status.deleteMany();

    // Then delete Useless records (they depend on Line)
    await prisma.useless.deleteMany();

    // Now it's safe to delete Line records
    await prisma.line.deleteMany();

    // Finally delete MainProtsess records
    await prisma.mainProtsess.deleteMany();

    return res.status(200).json({
      message: "All MainProtsess and related records deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleting MainProtsess:", error);
    return res
      .status(500)
      .json({ error: "Server error while deleting MainProtsess" });
  }
};
