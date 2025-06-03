// src/controllers/invoice.controller.ts
import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
});

interface AcceptProductPackRequestBody {
  invoiceId: string;
  userId: string;
  products: {
    productId: string;
    acceptCount: number;
    invalidCount?: number;
    invalidReason?: string;
    colorSizes: {
      colorSizeId: string;
      acceptCount: number;
      invalidCount?: number;
      invalidReason?: string;
    }[];
  }[];
}

export const acceptProductPack = async (req: Request, res: Response) => {
  const { invoiceId, userId, products } = req.body as AcceptProductPackRequestBody;

  // Validate required fields
  if (!invoiceId || !userId || !products?.length) {
    return res.status(400).json({ error: "invoiceId, userId, and products array are required" });
  }

  try {
    // Find user and employee
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: { include: { department: true } } },
    });

    if (!user || !user.employee) {
      return res.status(404).json({ error: "User or associated employee not found" });
    }

    const employeeId = user.employee.id;
    const employeeDepartment = user.employee.department;

    // Find invoice with status and product group
    const invoice = await prisma.invoice.findUnique({
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

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Find pending status
    const pendingStatus = invoice.status.find((status) => status.status === "Pending");
    if (!pendingStatus) {
      return res.status(400).json({ error: "Invoice does not have a pending status" });
    }

    // Check if final "ombor" step from "upakofka"
    const isFinalOmbor =
      invoice.department.toLowerCase() === "ombor" &&
      pendingStatus.targetDepartment?.toLowerCase() === "upakofka";

    // Transaction to update all relevant records
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let totalAcceptCount = 0;
      let totalInvalidCount = 0;
      const processRecords: any[] = [];

      // Validate and process each product
      for (const productData of products) {
        const { productId, acceptCount, invalidCount = 0, invalidReason = "", colorSizes } = productData;

        // Validate product input
        if (
          !productId ||
          !Number.isInteger(acceptCount) ||
          !Number.isInteger(invalidCount) ||
          acceptCount < 0 ||
          invalidCount < 0
        ) {
          throw new Error(`Invalid data for productId: ${productId}`);
        }

        const product = invoice.productGroup.products.find((p) => p.id === productId);
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Find the latest ProductProcess for this product
        const latestProductProcess = product.processes
          .filter((p) => p.invoiceId === invoice.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!latestProductProcess) {
          throw new Error(`No process found for product ${productId} in invoice ${invoiceId}`);
        }

        // Validate counts against sendedCount
        const availableCount = latestProductProcess.sendedCount;
        if (acceptCount + invalidCount > availableCount) {
          throw new Error(
            `Accept count (${acceptCount}) + invalid count (${invalidCount}) exceeds sent count (${availableCount}) for product ${productId}`
          );
        }

        const residueCount = availableCount - acceptCount - invalidCount;

        // Update ProductProcess
        const productProcess = await tx.productProcess.update({
          where: { id: latestProductProcess.id },
          data: {
            protsessIsOver: isFinalOmbor || residueCount === 0,
            status: isFinalOmbor || residueCount === 0 ? "QabulQilingan" : "ToliqYuborilmagan",
            acceptCount,
            invalidCount,
            invalidReason,
            residueCount,
            departmentName: employeeDepartment.name,
            departmentId: employeeDepartment.id,
          },
        });

        totalAcceptCount += acceptCount;
        totalInvalidCount += invalidCount;
        processRecords.push({ productId, productProcess });

        // Validate color sizes total
        const colorSizeTotalAccept = colorSizes.reduce((sum, cs) => sum + cs.acceptCount, 0);
        const colorSizeTotalInvalid = colorSizes.reduce((sum, cs) => sum + (cs.invalidCount ?? 0), 0);
        if (colorSizeTotalAccept + colorSizeTotalInvalid > acceptCount + invalidCount) {
          throw new Error(`Color size totals exceed product totals for product ${productId}`);
        }

        // Process each color size
        for (const colorSizeData of colorSizes) {
          const {
            colorSizeId,
            acceptCount: csAcceptCount,
            invalidCount: csInvalidCount = 0,
            invalidReason: csInvalidReason = "",
          } = colorSizeData;

          // Validate color size input
          if (
            !colorSizeId ||
            !Number.isInteger(csAcceptCount) ||
            !Number.isInteger(csInvalidCount) ||
            csAcceptCount < 0 ||
            csInvalidCount < 0
          ) {
            throw new Error(`Invalid data for colorSizeId: ${colorSizeId}`);
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

          // Find the latest ColorSizeProcess
          const latestColorSizeProcess = colorSize.processes
            .filter((p) => p.productProcessId === latestProductProcess.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          if (!latestColorSizeProcess) {
            throw new Error(`No process found for colorSize ${colorSizeId}`);
          }

          // Validate counts against sendedCount
          const csAvailableCount = latestColorSizeProcess.sendedCount;
          if (csAcceptCount + csInvalidCount > csAvailableCount) {
            throw new Error(
              `Accept count (${csAcceptCount}) + invalid count (${csInvalidCount}) exceeds sent count (${csAvailableCount}) for colorSize ${colorSizeId}`
            );
          }

          const csResidueCount = csAvailableCount - csAcceptCount - csInvalidCount;

          // Update ColorSizeProcess
          const colorSizeProcess = await tx.colorSizeProcess.update({
            where: { id: latestColorSizeProcess.id },
            data: {
              protsessIsOver: isFinalOmbor || csResidueCount === 0,
              status: isFinalOmbor || csResidueCount === 0 ? "QabulQilingan" : "ToliqYuborilmagan",
              acceptCount: csAcceptCount,
              invalidCount: csInvalidCount,
              invalidReason: csInvalidReason,
              residueCount: csResidueCount,
              departmentName: employeeDepartment.name,
              departmentId: employeeDepartment.id,
            },
          });

          // Update ProductColorSize status
          const isFullyAccepted = csResidueCount === 0;
          await tx.productColorSize.update({
            where: { id: colorSizeId },
            data: {
              isSended: false, // Reset for next send
              status: isFullyAccepted ? "QabulQilingan" : "Pending",
            },
          });

          processRecords.push({ productId, colorSizeId, colorSizeProcess });
        }

        // Update Product status
        const productAvailableCount =
          product.allTotalCount -
          product.processes.reduce((sum, p) => sum + p.sendedCount, 0) -
          product.processes.reduce((sum, p) => sum + p.invalidCount, 0);
        await tx.product.update({
          where: { id: productId },
          data: {
            isSended: productAvailableCount === 0,
            status: productAvailableCount === 0 ? "QabulQilingan" : "Pending",
          },
        });
      }

      // Update invoice-level ProductProtsess
      const totalSentCount = pendingStatus.sendedCount;
      if (totalAcceptCount + totalInvalidCount > totalSentCount) {
        throw new Error(
          `Total accept count (${totalAcceptCount}) + invalid count (${totalInvalidCount}) exceeds sent count (${totalSentCount}) for invoice`
        );
      }

      const residueCount = totalSentCount - totalAcceptCount - totalInvalidCount;

      await tx.productProtsess.delete({
        where: { id: pendingStatus.id },
      });

      const newStatus = await tx.productProtsess.create({
        data: {
          departmentName: employeeDepartment.name,
          protsessIsOver: isFinalOmbor || residueCount === 0,
          status: isFinalOmbor || residueCount === 0 ? "QabulQilingan" : "ToliqYuborilmagan",
          departmentId: employeeDepartment.id,
          targetDepartment: pendingStatus.targetDepartment || "",
          invoiceId,
          employeeId,
          acceptCount: totalAcceptCount,
          sendedCount: 0,
          residueCount,
          invalidCount: totalInvalidCount,
          invalidReason: products.some((p) => p.invalidReason) ? "Multiple reasons" : "",
          date: new Date(),
        },
      });

      // Update invoice
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { protsessIsOver: isFinalOmbor || residueCount === 0 },
      });

      return {
        newStatus,
        pendingStatusId: pendingStatus.id,
        isComplete: isFinalOmbor || residueCount === 0,
        processRecords,
      };
    });

    // Success response
    return res.status(200).json({
      message: `Successfully accepted ${result.newStatus.acceptCount} items${
        result.newStatus.invalidCount > 0 ? ` and marked ${result.newStatus.invalidCount} as invalid` : ""
      }${result.isComplete ? ". Process completed." : ""}`,
      deletedPendingStatus: result.pendingStatusId,
      newStatus: result.newStatus,
      processRecords: result.processRecords,
      isComplete: result.isComplete,
    });
  } catch (err: unknown) {
    console.error("Error accepting product pack:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: `Database error: ${err.message}` });
    }
    return res.status(500).json({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
