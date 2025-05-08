import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteAllMainProtsess = async (req: Request, res: Response) => {
  try {
    // Delete related Useless records first (since they are dependent on Line)
    await prisma.useless.deleteMany();

    // Delete related Line records next (since they are dependent on MainProtsess and Useless)
    await prisma.line.deleteMany();

    // Delete related CompletedSection records (since they are dependent on MainProtsess)
    await prisma.completedSection.deleteMany();

    // Finally, delete all MainProtsess records
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
