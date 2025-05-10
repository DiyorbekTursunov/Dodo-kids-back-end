import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create Product Pack
export const createProductPack = async (req: Request, res: Response) => {
  const { name, departmentId, department, productId, totalCount } = req.body;


  if (!name || !departmentId || !department || !productId || !totalCount) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // const existing = await prisma.productPack.findUnique({ where: { id } });
    // if (existing)
    //   return res.status(409).json({ error: "Product Pack already exists" });

    const productPack = await prisma.productPack.create({
      data: {
        name,
        departmentId,
        department,
        productId,
        totalCount,
      },
    });

    res.status(201).json(productPack);
  } catch (err) {
    console.error("Error creating Product Pack:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
