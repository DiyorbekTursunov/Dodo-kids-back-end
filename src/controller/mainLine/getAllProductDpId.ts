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
      },
      include: {
        status: true, // Include related lines and their statuses for each MainProtsess
        yaroqsizlarSoni: true,
        size: true,
        color: true,
        // completedBy: true,
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
