import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createProductProtsess = async (req: Request, res: Response) => {
  try {
    const {
      protsessIsOver,
      status,
      employeeId,
      departmentId,
      productpackId,
      acceptCount,
      sendedCount,
      invalidCount,
      invalidReason,
    } = req.body;

    if (
      !status || typeof status !== "string" ||
      !employeeId || typeof employeeId !== "string" ||
      !departmentId || typeof departmentId !== "string" ||
      !productpackId || typeof productpackId !== "string" ||
      typeof acceptCount !== "number" || acceptCount < 0 ||
      typeof sendedCount !== "number" || sendedCount < 0 ||
      typeof invalidCount !== "number" || invalidCount < 0
    ) {
      return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    const isOver = acceptCount + invalidCount === sendedCount;

    const newProcess = await prisma.productProtsess.create({
      data: {
        protsessIsOver: protsessIsOver ?? isOver,
        status,
        employeeId,
        departmentId,
        productpackId,
        acceptCount,
        sendedCount,
        invalidCount,
        invalidReason: invalidReason || "",
      },
    });

    return res.status(201).json(newProcess);
  } catch (error) {
    console.error("Error creating product process:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
