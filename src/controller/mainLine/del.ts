import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteAllMainProtsess = async (req: Request, res: Response) => {
  try {
    // Delete related Useless records first (since they are dependent on Line)

    // Delete related Line records next (since they are dependent on MainProtsess and Useless)
    await prisma.line.deleteMany();

    // Finally, delete all MainProtsess records
    await prisma.mainProtsess.deleteMany();

    await prisma.useless.deleteMany();
    await prisma.status.deleteMany()

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
