import { Request, Response } from "express";
import { createBichuvInvoice, CreateInvoiceInput } from "../../../service/bichuvInvoiceService/bichuvInvoice.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10000,
    timeout: 60000,
  },
});

// Transformation function to shape the invoice response
const transformInvoice = (invoice: any) => ({
  id: invoice.id,
  number: invoice.number,
  perentId: invoice.perentId,
  protsessIsOver: invoice.protsessIsOver,
  departmentId: invoice.departmentId,
  department: invoice.department,
  productGroupId: invoice.productGroupId,
  totalCount: invoice.totalCount,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt,
});

/**
 * Controller to create a new Bichuv invoice
 * @param req Express request object containing invoice data
 * @param res Express response object
 * @returns Response with created invoice details
 */
export const createBichuvController = async (req: Request, res: Response): Promise<Response> => {
  const { departmentId, productGroupId, totalCount, invalidCount, invalidReason, employeeId } = req.body as CreateInvoiceInput;

  // Validate input
  if (
    !departmentId ||
    !productGroupId ||
    !employeeId ||
    totalCount === undefined ||
    invalidCount === undefined ||
    invalidReason === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create invoice using service
    const invoiceId = await createBichuvInvoice({
      departmentId,
      productGroupId,
      totalCount,
      invalidCount,
      invalidReason,
      employeeId,
    });

    // Fetch created invoice for response
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        productGroup: true,
      },
    });

    if (!invoice) {
      return res.status(500).json({ error: "Failed to fetch created invoice" });
    }

    const transformedInvoice = transformInvoice(invoice);
    return res.status(201).json({
      data: [transformedInvoice],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  } catch (error) {
    console.error("Error creating Bichuv invoice:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
