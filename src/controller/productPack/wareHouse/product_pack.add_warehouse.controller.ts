import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Create Invoice
export const addInvoice = async (req: Request, res: Response) => {
  // Destructure request body
  const {
    departmentId,
    department,
    productGroupId,
    totalCount,
    invalidCount,
    invalidReason,
    employeeId,
    isOutsource = false, // Default to false if not provided
  } = req.body;

  // Validate required fields
  if (
    !departmentId ||
    !department ||
    !productGroupId ||
    !totalCount ||
    !employeeId ||
    !isOutsource
  ) {
    return res.status(400).json({
      error:
        "All fields (departmentId, department, productGroupId, totalCount, employeeId) are required",
      data: {
        departmentId,
        department,
        productGroupId,
        totalCount,
        invalidCount,
        invalidReason,
        employeeId,
        isOutsource,
      },
    });
  }

  // Validate numeric inputs
  if (
    isNaN(Number(totalCount)) ||
    (invalidCount && isNaN(Number(invalidCount)))
  ) {
    return res.status(400).json({
      error: "totalCount and invalidCount (if provided) must be numbers",
    });
  }

  try {
    // Check if product group exists
    const productGroup = await prisma.productGroup.findUnique({
      where: { id: productGroupId },
    });

    if (!productGroup) {
      return res.status(404).json({ error: "Product group not found" });
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

    // Generate a unique invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { number: "desc" },
    });
    const newInvoiceNumber = lastInvoice ? lastInvoice.number + 1 : 1;

    // Create the invoice and product process in a transaction
    const newInvoice = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          perentId,
          number: newInvoiceNumber,
          departmentId,
          department,
          totalCount: Number(totalCount),
          protsessIsOver: false,
          productGroupId,
          isOutsource,
        },
        include: {
          ProductGroup: true,
        },
      });

      // Create the product process
      const productProcess = await tx.productProtsess.create({
        data: {
          departmentName: department,
          status: "Qabul qilingan",
          departmentId,
          invoiceId: invoice.id,
          targetDepartment: department,
          acceptanceDepartment: department,
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
}
