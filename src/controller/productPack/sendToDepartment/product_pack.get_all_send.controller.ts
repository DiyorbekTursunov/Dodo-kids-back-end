import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create Product Pack
export const createProductPack = async (req: Request, res: Response) => {
  const {
    name,
    departmentId,
    department,
    productId,
    totalCount,
    acceptCount,
    sendedCount,
    invalidCount,
    invalidReason,
  } = req.body;

  if (
    !name ||
    !departmentId ||
    !department ||
    !productId ||
    !totalCount ||
    !acceptCount ||
    !sendedCount ||
    !invalidCount ||
    !invalidReason
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Create the product pack
    const productPack = await prisma.productPack.create({
      data: {
        name,
        departmentId,
        department,
        productId,
        totalCount: Number(totalCount),
        protsessIsOver: false,
        // Connect to the Product relation
        Product: {
          connect: { id: productId },
        },
        // Initialize with default ProductProtsess if needed
        status: {
          create: {
            protsessIsOver:
              sendedCount + invalidCount === totalCount ? true : false,
            status:
              sendedCount + invalidCount === totalCount
                ? "Yuborilgan"
                : "To'liq yuborilmagan",
            departmentId,
            employeeId: req.body.employeeId || "", // Assuming employeeId might be provided or use empty string
            acceptCount: Number(acceptCount),
            sendedCount: Number(sendedCount),
            residueCount: Number(totalCount) - Number(sendedCount),
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
    res.status(500).json({ error: "Internal server error" });
  }
};
