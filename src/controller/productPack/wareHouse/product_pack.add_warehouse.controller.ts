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

    // Check if department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Generate a parent ID
    const perentId = uuidv4();

    // Create the product pack with a transaction to ensure consistency
    const productPack = await prisma.$transaction(async (tx) => {
      // First create the product pack
      const newProductPack = await tx.productPack.create({
        data: {
          perentId,
          name,
          departmentId,
          department,
          totalCount: Number(totalCount),
          protsessIsOver: false,
          Product: {
            connect: { id: productId },
          },
        },
        include: {
          Product: true,
        },
      });

      // Then create the product process separately
      const productProcess = await tx.productProtsess.create({
        data: {
          departmentName: "ombor",
          status: "Qabul qilingan",
          departmentId,
          productpackId: newProductPack.id, // Use the new product pack ID
          targetDepartment: "ombor",
          employeeId,
          acceptCount: Number(totalCount),
          sendedCount: 0,
          residueCount: Number(totalCount) - (Number(invalidCount) || 0),
          invalidCount: Number(invalidCount) || 0,
          invalidReason: invalidReason || "",
        },
      });

      return {
        ...newProductPack,
        status: [productProcess],
      };
    });

    res.status(201).json(productPack);
  } catch (err) {
    console.error("Error creating Product Pack:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message,
    });
  }
};
