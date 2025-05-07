import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a single employee type by ID
export const getEmployeeTypeById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const type = await prisma.department.findUnique({ where: { id } });
      if (!type) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(type);
    } catch (error) {
      console.error("Get employee type error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
