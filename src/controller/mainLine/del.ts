import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteAllMainProtsess = async (req: Request, res: Response) => {
  try {
    // Fetch all MainProtsess IDs
    const mainProtsessList = await prisma.mainProtsess.findMany({
      select: { id: true },
    });

    if (mainProtsessList.length === 0) {
      return res.status(404).json({ error: "No MainProtsess found to delete" });
    }

    // Delete all associated records and MainProtsess
    await prisma.mainProtsess.deleteMany({
      where: {
        id: {
          in: mainProtsessList.map((item) => item.id),
        },
      },
    });

    return res.status(200).json({
      message: "All MainProtsess and related records deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleting MainProtsess:", error);
    return res.status(500).json({ error: "Server error while deleting MainProtsess" });
  }
};
