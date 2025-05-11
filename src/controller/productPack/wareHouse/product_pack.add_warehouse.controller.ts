import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Create Product Pack
export const addWareHouse = async (req: Request, res: Response) => {
  const {
    name,
    departmentId,
    department,
    productId,
    totalCount,
    invalidCount,
    invalidReason,
    employeeId,
  } = req.body;

  if (
    !name ||
    !departmentId ||
    !department ||
    !productId ||
    !totalCount ||
    !employeeId
  ) {
    return res.status(400).json({
      error: "All fields are required",
      data: {
        name,
        departmentId,
        department,
        productId,
        totalCount,
        invalidCount,
        invalidReason,
        employeeId,
      },
    });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Generate a parent ID
    const perentId = uuidv4();

    // Create the product pack
    const productPack = await prisma.productPack.create({
      data: {
        perentId: perentId,
        name,
        departmentId,
        department,
        totalCount: Number(totalCount),
        protsessIsOver: false,
        // Connect to the Product relation - this will set the productId field
        Product: {
          connect: { id: productId },
        },
        // Initialize with default ProductProtsess if needed
        status: {
          create: {
            status: "Qabul qilingan",
            departmentId,
            employeeId: employeeId,
            acceptCount: Number(totalCount),
            sendedCount: 0,
            residueCount: 0,
            invalidCount: Number(invalidCount) || 0,
            invalidReason: invalidReason || "",
          },
        },
      },
      include: {
        Product: true,
        status: true,
      },
    });

    res.status(201).json(productPack);
  } catch (err) {
    console.error("Error creating Product Pack:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message
    });
  }
};
