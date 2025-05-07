import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all employee types
export const getAllEmployeeTypes = async (req: Request, res: Response) => {
    try {
      const types = await prisma.employeeType.findMany();
      return res.status(200).json(types);
    } catch (error) {
      console.error("Get employee types error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
