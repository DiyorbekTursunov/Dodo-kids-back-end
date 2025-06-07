import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
});

export interface CreateInvoiceInput {
  departmentId: string;
  productGroupId: string;
  totalCount: number;
  invalidCount: number;
  invalidReason: string;
  employeeId: string;
}

/**
 * Creates an invoice for the Bichuv department and updates related model statuses to "QabulQilingan".
 * @param data - Input data containing departmentId, productGroupId, totalCount, invalidCount, invalidReason, and employeeId.
 * @returns Promise<string> - The ID of the created invoice
 * @throws Error if department or product group is not found, or if the transaction fails
 */
export async function createBichuvInvoice(data: CreateInvoiceInput): Promise<string> {
  const {
    departmentId,
    productGroupId,
    totalCount,
    invalidCount,
    invalidReason,
    employeeId,
  } = data;
  const status = "QabulQilingan";

  try {
    return await prisma.$transaction(async (tx) => {
      // Validate department existence
      const department = await tx.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        throw new Error("Department not found");
      }

      // Validate product group existence
      const productGroup = await tx.productGroup.findUnique({
        where: { id: productGroupId },
      });
      if (!productGroup) {
        throw new Error("Product group not found");
      }

      // Update product group status
      await tx.productGroup.update({
        where: { id: productGroupId },
        data: { status },
      });

      // Update products' statuses
      const products = await tx.product.findMany({
        where: { productGroupId },
        select: { id: true },
      });
      const productIds = products.map((p) => p.id);
      await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: { status },
      });

      // Update product settings' statuses
      const productSettings = await tx.productSetting.findMany({
        where: { productId: { in: productIds } },
        select: { id: true },
      });
      const productSettingIds = productSettings.map((ps) => ps.id);
      await tx.productSetting.updateMany({
        where: { id: { in: productSettingIds } },
        data: { status },
      });

      // Update size groups' statuses
      const sizeGroups = await tx.sizeGroup.findMany({
        where: { productSettingId: { in: productSettingIds } },
        select: { id: true },
      });
      const sizeGroupIds = sizeGroups.map((sg) => sg.id);
      await tx.sizeGroup.updateMany({
        where: { id: { in: sizeGroupIds } },
        data: { status },
      });

      // Update color sizes' statuses
      const colorSizes = await tx.productColorSize.findMany({
        where: { sizeGroupId: { in: sizeGroupIds } },
        select: { id: true },
      });
      const colorSizeIds = colorSizes.map((cs) => cs.id);
      await tx.productColorSize.updateMany({
        where: { id: { in: colorSizeIds } },
        data: { status },
      });

      // Generate invoice number and create invoice
      const invoiceNumber = await getNextInvoiceNumber(tx);
      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          perentId: "inv_parent_001", // Default parent ID, adjust as needed
          protsessIsOver: false,
          departmentId,
          department: department.name,
          productGroupId,
          totalCount,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create ProductProtsess entry
      const acceptCount = totalCount - invalidCount;
      await tx.productProtsess.create({
        data: {
          invoiceId: invoice.id,
          status,
          employeeId,
          departmentName: department.name,
          departmentId,
          acceptCount,
          sendedCount: totalCount,
          invalidCount,
          residueCount: 0,
          totalCount,
          invalidReason,
          date: new Date(),
          protsessIsOver: false,
          isOutsourseCompany: false,
        },
      });

      return invoice.id;
    });
  } catch (error) {
    throw new Error(`Failed to create invoice: ${(error as Error).message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Retrieves the next available invoice number.
 * @param tx - Prisma transaction client
 * @returns Promise<number> - The next invoice number
 */
export async function getNextInvoiceNumber(tx: any): Promise<number> {
  const lastInvoice = await tx.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (lastInvoice?.number || 0) + 1;
}
