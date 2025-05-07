import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllMainLineProgressHandler = async (
  req: Request,
  res: Response
) => {
  try {
    // ✅ Get all mainProtsess with the associated lines
    const mainLineProgress = await prisma.mainProtsess.findMany({
      include: {
        line: true, // Include the related lines
      },
    });

    if (!mainLineProgress.length) {
      return res.status(404).json({ error: "No mainLineProgress found" });
    }

    return res.status(200).json(mainLineProgress);
  } catch (error) {
    console.error("Error fetching mainLineProgress:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
