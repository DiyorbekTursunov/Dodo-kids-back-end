import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLinesByDepartmentController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { departmentId } = req.params;

  try {
    if (!departmentId || typeof departmentId !== "string") {
      res.status(400).json({ success: false, message: "Missing departmentId" });
      return;
    }

    const lines = await prisma.line.findMany({
      where: {
        departmentId: departmentId, // using the string name like "ombor"
        status: { hasSome: ["qabul qilingan"] }, // Filter by status
      },
    });

    res.status(200).json({
      success: true,
      data: lines,
    });
  } catch (error) {
    console.error("Error fetching lines by department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lines by department",
    });
  }
};
