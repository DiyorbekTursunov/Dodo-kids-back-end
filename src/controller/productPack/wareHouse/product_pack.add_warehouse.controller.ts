import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Create Invoice
export const addInvoice = async (req: Request, res: Response) => {
  // Destructure request body, excluding 'name'
  const {
    departmentId,
    department,
    productId,
    totalCount,
    invalidCount,
    invalidReason,
    employeeId,
  } = req.body;

  // Validate required fields
  if (!departmentId || !department || !productId || !totalCount || !employeeId) {
    return res.status(400).json({
      error: "All fields (departmentId, department, productId, totalCount, employeeId) are required",
      data: {
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

  // Validate numeric inputs
  if (isNaN(Number(totalCount)) || (invalidCount && isNaN(Number(invalidCount)))) {
    return res.status(400).json({
      error: "totalCount and invalidCount (if provided) must be numbers",
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

    // Generate a unique parent ID
    const perentId = uuidv4();

    // Create the invoice and product process in a transaction
    const newInvoice = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          perentId,
          number: 1, // Replace with proper invoice number generation logic
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

      // Create the product process
      const productProcess = await tx.productProtsess.create({
        data: {
          departmentName: department,
          status: "Qabul qilingan",
          departmentId,
          invoiceId: invoice.id, // Corrected from productpackId
          targetDepartment: department,
          employeeId,
          acceptCount: Number(totalCount),
          sendedCount: 0,
          residueCount: Number(totalCount) - (Number(invalidCount) || 0),
          invalidCount: Number(invalidCount) || 0,
          invalidReason: invalidReason || "",
        },
      });

      // Return invoice with product process in status array
      return {
        ...invoice,
        status: [productProcess],
      };
    });

    // Return the created invoice with its status
    res.status(201).json(newInvoice);
  } catch (err: unknown) {
    console.error("Error creating invoice:", err);

    // Handle Prisma-specific errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Duplicate entry detected" });
      }
    }

    // Handle generic errors
    if (err instanceof Error) {
      return res.status(500).json({
        error: "Internal server error",
        details: err.message,
      });
    }

    // Fallback for unknown errors
    return res.status(500).json({
      error: "Internal server error",
      details: "An unknown error occurred",
    });
  }
};
