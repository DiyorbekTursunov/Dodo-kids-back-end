import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProductsByDepartmentController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const departmentId = String(req.query);

  try {
    if (!departmentId || typeof departmentId !== "string") {
      res.status(400).json({ success: false, message: "Missing departmentId" });
      return;
    }

    const products = await prisma.mainProtsess.findMany({
      include: {
        line: {
          where: {
            departmentId: departmentId,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products by department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products by department",
    });
  }
};
