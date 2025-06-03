// src/controllers/invoice.controller.ts
import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

interface AddInvoiceRequestBody {
  departmentId: string;
  department: string;
  productGroupId: string;
  totalCount: number;
  invalidCount?: number;
  invalidReason?: string;
  employeeId: string;
  isOutsource?: boolean;
}

export const addInvoice = async (req: Request, res: Response) => {
  const {
    departmentId,
    department,
    productGroupId,
    totalCount,
    invalidCount,
    invalidReason,
    employeeId,
    isOutsource = false,
  } = req.body as AddInvoiceRequestBody;

  // Validate required fields
  if (!departmentId || !department || !productGroupId || totalCount == null || !employeeId) {
    return res.status(400).json({
      error: "Required fields: departmentId, department, productGroupId, totalCount, employeeId",
      data: req.body,
    });
  }

  // Validate numeric inputs
  if (isNaN(Number(totalCount)) || (invalidCount != null && isNaN(Number(invalidCount)))) {
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

    // Check if employee exists
    const employeeExists = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employeeExists) {
      return res.status(404).json({ error: "Employee not found" });
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
          productGroup: true, // Fixed: Changed ProductGroup to productGroup
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
    return res.status(201).json(newInvoice);
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
