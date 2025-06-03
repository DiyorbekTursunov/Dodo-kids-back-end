import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { RequestBody } from "../../../types/product/product.interface";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
});

// Explicitly define the type for targetInvoice to include ProductProcess
type InvoiceWithProductProcess = {
  id: string;
  number: number;
  perentId: string;
  protsessIsOver: boolean;
  departmentId: string;
  department: string;
  productGroupId: string;
  totalCount: number;
  createdAt: Date;
  updatedAt: Date;
  isOutsource: boolean;
  outsourseCompanyId: string | null;
  ProductProcess: {
    id: string;
    protsessIsOver: boolean;
    status: string;
    employeeId: string;
    departmentName: string;
    departmentId: string;
    acceptCount: number;
    sendedCount: number;
    invalidCount: number;
    invalidReason: string;
    residueCount: number;
    productId: string;
    invoiceId: string;
  }[];
};

export const sendToDepartment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { invoiceId, targetDepartmentId, employeeId, products } = req.body as RequestBody;

  // Validate required fields
  if (!invoiceId || !targetDepartmentId || !employeeId || !products?.length) {
    return res.status(400).json({ error: "Missing required fields or products array" });
  }

  try {
    // Fetch source invoice with nested data
    const sourceInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        status: true,
        productGroup: {
          include: {
            products: {
              include: {
                processes: true,
                productSetting: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: { include: { processes: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sourceInvoice) {
      return res.status(404).json({ error: "Source invoice not found" });
    }

    // Fetch target department
    const targetDepartment = await prisma.department.findUnique({
      where: { id: targetDepartmentId },
    });

    if (!targetDepartment) {
      return res.status(404).json({ error: "Target department not found" });
    }

    // Handle "avsors" redirect to "chistka"
    let actualTargetDepartment = targetDepartment;
    if (targetDepartment.name === "avsors") {
      const chistkaDepartment = await prisma.department.findFirst({
        where: { name: "chistka" },
      });
      if (!chistkaDepartment) {
        return res.status(404).json({ error: "Chistka department not found" });
      }
      actualTargetDepartment = chistkaDepartment;
    }

    // Check for an existing invoice for the same Production Group and target department
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        productGroupId: sourceInvoice.productGroupId,
        departmentId: actualTargetDepartment.id,
        protsessIsOver: false,
      },
      include: {
        ProductProcess: true, // Include ProductProcess relation
      },
    });

    // Transaction for process updates
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let targetInvoice: InvoiceWithProductProcess;
      let totalSentCount = 0;
      let totalInvalidCount = 0;
      const processRecords: any[] = [];

      if (existingInvoice) {
        targetInvoice = existingInvoice;
      } else {
        // Create a new invoice with ProductProcess included
        targetInvoice = await tx.invoice.create({
          data: {
            perentId: sourceInvoice.perentId,
            number: sourceInvoice.number + 1,
            departmentId: actualTargetDepartment.id,
            department: actualTargetDepartment.name,
            productGroupId: sourceInvoice.productGroupId,
            totalCount: 0,
            protsessIsOver: false,
            status: {
              create: {
                protsessIsOver: false,
                status: "Pending",
                departmentName: actualTargetDepartment.name,
                departmentId: actualTargetDepartment.id,
                targetDepartment: sourceInvoice.department,
                employeeId,
                acceptCount: 0,
                sendedCount: 0,
                residueCount: 0,
                invalidCount: 0,
                invalidReason: "",
                date: new Date(),
              },
            },
          },
          include: {
            ProductProcess: true, // Ensure ProductProcess is included
          },
        });
      }

      for (const productData of products) {
        const {
          productId,
          acceptCount,
          sendedCount,
          invalidCount = 0,
          invalidReason = "",
          colorSizes,
        } = productData;

        // Validate product input
        if (
          !productId ||
          !Number.isInteger(acceptCount) ||
          !Number.isInteger(sendedCount) ||
          !Number.isInteger(invalidCount)
        ) {
          throw new Error(`Invalid product data for productId: ${productId}`);
        }

        const product = sourceInvoice.productGroup.products.find((p) => p.id === productId);
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Calculate available product count
        const productSentCount = product.processes.reduce((sum, p) => sum + p.sendedCount, 0);
        const productInvalidCount = product.processes.reduce((sum, p) => sum + p.invalidCount, 0);
        const availableProductCount = product.allTotalCount - productSentCount - productInvalidCount;

        if (sendedCount + invalidCount > availableProductCount) {
          throw new Error(
            `Cannot send ${sendedCount + invalidCount} items for product ${productId}; only ${availableProductCount} available`
          );
        }

        // Check if the product already exists in the invoice
        const existingProductProcess = targetInvoice.ProductProcess?.find(
          (pp: { productId: string }) => pp.productId === productId
        );

        if (existingProductProcess) {
          // Update existing ProductProcess
          const updatedProductProcess = await tx.productProcess.update({
            where: { id: existingProductProcess.id },
            data: {
              sendedCount: existingProductProcess.sendedCount + sendedCount,
              invalidCount: existingProductProcess.invalidCount + invalidCount,
              invalidReason: invalidReason || existingProductProcess.invalidReason,
              residueCount: availableProductCount - (existingProductProcess.sendedCount + sendedCount) - (existingProductProcess.invalidCount + invalidCount),
              protsessIsOver: existingProductProcess.sendedCount + sendedCount + invalidCount === availableProductCount,
              status: existingProductProcess.sendedCount + sendedCount + invalidCount === availableProductCount ? "Yuborilgan" : "ToliqYuborilmagan",
            },
          });
          processRecords.push({ productId, productProcess: updatedProductProcess });
        } else {
          // Create new ProductProcess
          const newProductProcess = await tx.productProcess.create({
            data: {
              protsessIsOver: sendedCount + invalidCount === availableProductCount,
              status: sendedCount + invalidCount === availableProductCount ? "Yuborilgan" : "ToliqYuborilmagan",
              employeeId,
              departmentName: actualTargetDepartment.name,
              departmentId: actualTargetDepartment.id,
              acceptCount,
              sendedCount,
              invalidCount,
              invalidReason,
              residueCount: availableProductCount - sendedCount - invalidCount,
              productId,
              invoiceId: targetInvoice.id,
            },
          });
          processRecords.push({ productId, productProcess: newProductProcess });
        }

        totalSentCount += sendedCount;
        totalInvalidCount += invalidCount;

        // Validate color sizes total
        const colorSizeTotalSent = colorSizes.reduce((sum, cs) => sum + cs.sendedCount, 0);
        const colorSizeTotalInvalid = colorSizes.reduce((sum, cs) => sum + (cs.invalidCount ?? 0), 0);
        if (colorSizeTotalSent + colorSizeTotalInvalid > sendedCount + invalidCount) {
          throw new Error(`Color size totals exceed product totals for product ${productId}`);
        }

        for (const colorSizeData of colorSizes) {
          const {
            colorSizeId,
            acceptCount: csAcceptCount,
            sendedCount: csSendedCount,
            invalidCount: csInvalidCount = 0,
            invalidReason: csInvalidReason = "",
          } = colorSizeData;

          // Validate color size input
          if (
            !colorSizeId ||
            !Number.isInteger(csAcceptCount) ||
            !Number.isInteger(csSendedCount) ||
            !Number.isInteger(csInvalidCount)
          ) {
            throw new Error(`Invalid color size data for colorSizeId: ${colorSizeId}`);
          }

          // Find the colorSize
          let colorSize;
          for (const setting of product.productSetting) {
            for (const sizeGroup of setting.sizeGroups) {
              colorSize = sizeGroup.colorSizes.find((cs) => cs.id === colorSizeId);
              if (colorSize) break;
            }
            if (colorSize) break;
          }

          if (!colorSize) {
            throw new Error(`ColorSize ${colorSizeId} not found`);
          }

          // Calculate available color size count
          const colorSizeSentCount = colorSize.processes?.reduce((sum, p) => sum + p.sendedCount, 0) || 0;
          const colorSizeInvalidCount = colorSize.processes?.reduce((sum, p) => sum + p.invalidCount, 0) || 0;
          const availableColorSizeCount = colorSize.quantity - colorSizeSentCount - colorSizeInvalidCount;

          if (csSendedCount + csInvalidCount > availableColorSizeCount) {
            throw new Error(
              `Cannot send ${csSendedCount + csInvalidCount} items for color size ${colorSizeId}; only ${availableColorSizeCount} available`
            );
          }

          // Create ColorSizeProcess record
          const colorSizeProcess = await tx.colorSizeProcess.create({
            data: {
              protsessIsOver: csSendedCount + csInvalidCount === availableColorSizeCount,
              status: csSendedCount + csInvalidCount === availableColorSizeCount ? "Yuborilgan" : "ToliqYuborilmagan",
              employeeId,
              departmentName: actualTargetDepartment.name,
              departmentId: actualTargetDepartment.id,
              acceptCount: csAcceptCount,
              sendedCount: csSendedCount,
              invalidCount: csInvalidCount,
              invalidReason: csInvalidReason,
              residueCount: availableColorSizeCount - csSendedCount - csInvalidCount,
              colorSizeId,
              productProcessId: processRecords.find((r) => r.productId === productId).productProcess.id,
            },
          });

          // Update ProductColorSize status
          const isFullySent = csSendedCount + csInvalidCount === availableColorSizeCount;
          await tx.productColorSize.update({
            where: { id: colorSizeId },
            data: {
              isSended: isFullySent,
              status: isFullySent ? "Yuborilgan" : "Pending",
            },
          });

          processRecords.push({ productId, colorSizeId, colorSizeProcess });
        }

        // Update Product status
        const remainingProductCount =
          product.allTotalCount -
          product.processes.reduce((sum, p) => sum + p.sendedCount, 0) -
          product.processes.reduce((sum, p) => sum + p.invalidCount, 0);
        await tx.product.update({
          where: { id: productId },
          data: {
            isSended: remainingProductCount === 0,
            status: remainingProductCount === 0 ? "Yuborilgan" : "Pending",
          },
        });
      }

      // Update invoice status
      const totalInvoiceCount = sourceInvoice.totalCount;
      const invoiceSentCount = sourceInvoice.status.reduce((sum, s) => sum + s.sendedCount, 0);
      const invoiceInvalidCount = sourceInvoice.status.reduce((sum, s) => sum + s.invalidCount, 0);
      const newInvoiceSentCount = invoiceSentCount + totalSentCount;
      const newInvoiceInvalidCount = invoiceInvalidCount + totalInvalidCount;
      const invoiceResidueCount = totalInvoiceCount - newInvoiceSentCount - newInvoiceInvalidCount;

      const latestInvoiceStatus = sourceInvoice.status[0]
        ? sourceInvoice.status.reduce((latest, current) =>
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null;

      const newSourceStatus = await tx.productProtsess.create({
        data: {
          protsessIsOver: newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount,
          status: newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount ? "Yuborilgan" : "ToliqYuborilmagan",
          departmentName: actualTargetDepartment.name,
          departmentId: actualTargetDepartment.id,
          invoiceId,
          employeeId,
          acceptCount: latestInvoiceStatus?.acceptCount || totalInvoiceCount,
          sendedCount: totalSentCount,
          residueCount: invoiceResidueCount,
          invalidCount: totalInvalidCount,
          invalidReason: products.some((p) => p.invalidReason) ? "Multiple reasons" : "",
          date: new Date(),
        },
      });

      if (newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount) {
        await tx.invoice.update({
          where: { id: sourceInvoice.id },
          data: { protsessIsOver: true },
        });
      }

      // Update the target invoice's total count
      const updatedTotalCount = (existingInvoice?.totalCount || 0) + totalSentCount;
      await tx.invoice.update({
        where: { id: targetInvoice.id },
        data: {
          totalCount: updatedTotalCount,
        },
      });

      return {
        message: `Successfully sent ${totalSentCount} items to ${actualTargetDepartment.name}`,
        sourceStatus: newSourceStatus,
        targetInvoice,
        processRecords,
        remainingItems: invoiceResidueCount,
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error sending product to department:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
