import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { RequestBody } from "../../../types/product/product.interface";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
});

export const sendToDepartment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { invoiceId, targetDepartmentId, employeeId, products } =
    req.body as RequestBody;

  // Validate required fields
  if (!invoiceId || !targetDepartmentId || !employeeId || !products?.length) {
    return res
      .status(400)
      .json({ error: "Missing required fields or products array" });
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
                productSetting: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: { include: { processes: true } },
                      },
                    },
                  },
                },
                processes: true,
              },
            },
          },
        },
      },
    });

    if (!sourceInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
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

    // Transaction for process updates
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let totalSentCount = 0;
        let totalInvalidCount = 0;
        const processRecords: any[] = [];

        for (const productData of products) {
          const {
            productId,
            acceptCount,
            sendedCount,
            invalidCount,
            invalidReason,
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

          const product = sourceInvoice.productGroup.products.find(
            (p) => p.id === productId
          );
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }

          // Calculate available product count
          const productSentCount = product.processes.reduce(
            (sum, p) => sum + p.sendedCount,
            0
          );
          const productInvalidCount = product.processes.reduce(
            (sum, p) => sum + p.invalidCount,
            0
          );
          const productAvailableCount =
            product.allTotalCount - productSentCount - productInvalidCount;

          if (sendedCount + invalidCount > productAvailableCount) {
            throw new Error(
              `Cannot send ${
                sendedCount + invalidCount
              } items for product ${productId}; only ${productAvailableCount} available`
            );
          }

          // Create ProductProcess record
          const productProcess = await tx.productProcess.create({
            data: {
              protsessIsOver: sendedCount + invalidCount === productAvailableCount,
              status:
                sendedCount + invalidCount === productAvailableCount
                  ? "Yuborilgan"
                  : "ToliqYuborilmagan",
              employeeId,
              departmentName: actualTargetDepartment.name,
              departmentId: actualTargetDepartment.id,
              acceptCount,
              sendedCount,
              invalidCount,
              invalidReason,
              residueCount: productAvailableCount - sendedCount - invalidCount,
              productId,
              invoiceId: sourceInvoice.id,
            },
          });

          totalSentCount += sendedCount;
          totalInvalidCount += invalidCount;
          processRecords.push({ productId, productProcess });

          // Validate color sizes total
          const colorSizeTotalSent = colorSizes.reduce(
            (sum, cs) => sum + cs.sendedCount,
            0
          );
          const colorSizeTotalInvalid = colorSizes.reduce(
            (sum, cs) => sum + cs.invalidCount,
            0
          );
          if (
            colorSizeTotalSent + colorSizeTotalInvalid >
            sendedCount + invalidCount
          ) {
            throw new Error(
              `Color size totals exceed product totals for product ${productId}`
            );
          }

          for (const colorSizeData of colorSizes) {
            const {
              colorSizeId,
              acceptCount: csAcceptCount,
              sendedCount: csSendedCount,
              invalidCount: csInvalidCount,
              invalidReason: csInvalidReason,
            } = colorSizeData;

            // Validate color size input
            if (
              !colorSizeId ||
              !Number.isInteger(csAcceptCount) ||
              !Number.isInteger(csSendedCount) ||
              !Number.isInteger(csInvalidCount)
            ) {
              throw new Error(
                `Invalid color size data for colorSizeId: ${colorSizeId}`
              );
            }

            // Find the colorSize across all product settings and size groups
            let colorSize;
            for (const setting of product.productSetting) {
              for (const sizeGroup of setting.sizeGroups) {
                colorSize = sizeGroup.colorSizes.find(
                  (cs) => cs.id === colorSizeId
                );
                if (colorSize) break;
              }
              if (colorSize) break;
            }

            if (!colorSize) {
              throw new Error(`ColorSize ${colorSizeId} not found`);
            }

            // Calculate available color size count
            const colorSizeSentCount =
              colorSize.processes?.reduce((sum, p) => sum + p.sendedCount, 0) ||
              0;
            const colorSizeInvalidCount =
              colorSize.processes?.reduce((sum, p) => sum + p.invalidCount, 0) ||
              0;
            const colorSizeAvailableCount =
              colorSize.quantity - colorSizeSentCount - colorSizeInvalidCount;

            if (csSendedCount + csInvalidCount > colorSizeAvailableCount) {
              throw new Error(
                `Cannot send ${
                  csSendedCount + csInvalidCount
                } items for color size ${colorSizeId}; only ${colorSizeAvailableCount} available`
              );
            }

            // Create ColorSizeProcess record
            const colorSizeProcess = await tx.colorSizeProcess.create({
              data: {
                protsessIsOver:
                  csSendedCount + csInvalidCount === colorSizeAvailableCount,
                status:
                  csSendedCount + csInvalidCount === colorSizeAvailableCount
                    ? "Yuborilgan"
                    : "ToliqYuborilmagan",
                employeeId,
                departmentName: actualTargetDepartment.name,
                departmentId: actualTargetDepartment.id,
                acceptCount: csAcceptCount,
                sendedCount: csSendedCount,
                invalidCount: csInvalidCount,
                invalidReason: csInvalidReason,
                residueCount:
                  colorSizeAvailableCount - csSendedCount - csInvalidCount,
                colorSizeId,
                productProcessId: productProcess.id,
              },
            });

            // Update ProductColorSize status
            const isFullySent =
              csSendedCount + csInvalidCount === colorSizeAvailableCount;
            await tx.productColorSize.update({
              where: { id: colorSizeId },
              data: {
                isSended: isFullySent,
                status: isFullySent ? "Yuborilgan" : "Pending",
              },
            });

            processRecords.push({
              productId,
              colorSizeId,
              colorSizeProcess,
            });
          }
        }

        // Update invoice status
        const totalInvoiceCount = sourceInvoice.totalCount;
        const invoiceSentCount = sourceInvoice.status.reduce(
          (sum, s) => sum + s.sendedCount,
          0
        );
        const invoiceInvalidCount = sourceInvoice.status.reduce(
          (sum, s) => sum + s.invalidCount,
          0
        );
        const newInvoiceSentCount = invoiceSentCount + totalSentCount;
        const newInvoiceInvalidCount = invoiceInvalidCount + totalInvalidCount;
        const invoiceResidueCount =
          totalInvoiceCount - newInvoiceSentCount - newInvoiceInvalidCount;

        const latestInvoiceStatus = sourceInvoice.status[0]
          ? sourceInvoice.status.reduce((latest, current) =>
              new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest
            )
          : null;

        const newSourceStatus = await tx.productProtsess.create({
          data: {
            protsessIsOver:
              newInvoiceSentCount + newInvoiceInvalidCount ===
              totalInvoiceCount,
            status:
              newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount
                ? "Yuborilgan"
                : "ToliqYuborilmagan",
            departmentName: actualTargetDepartment.name,
            departmentId: actualTargetDepartment.id,
            invoiceId,
            employeeId,
            acceptCount: latestInvoiceStatus?.acceptCount || totalInvoiceCount,
            sendedCount: totalSentCount,
            residueCount: invoiceResidueCount,
            invalidCount: totalInvalidCount,
            invalidReason: products.some((p) => p.invalidReason)
              ? "Multiple reasons"
              : "",
          },
        });

        if (
          newInvoiceSentCount + newInvoiceInvalidCount ===
          totalInvoiceCount
        ) {
          await tx.invoice.update({
            where: { id: sourceInvoice.id },
            data: { protsessIsOver: true },
          });
        }

        // Create new invoice for target department
        const newInvoice = await tx.invoice.create({
          data: {
            perentId: sourceInvoice.perentId,
            number: sourceInvoice.number + 1,
            departmentId: actualTargetDepartment.id,
            department: actualTargetDepartment.name,
            productGroupId: sourceInvoice.productGroupId,
            totalCount: totalSentCount,
            protsessIsOver: false,
            status: {
              create: {
                protsessIsOver: false,
                status: "Pending",
                departmentName: actualTargetDepartment.name,
                departmentId: actualTargetDepartment.id,
                targetDepartment: sourceInvoice.department,
                acceptanceDepartment: actualTargetDepartment.name,
                employeeId,
                acceptCount: 0,
                sendedCount: 0,
                residueCount: totalSentCount,
                invalidCount: 0,
                invalidReason: "",
              },
            },
          },
          include: { status: true },
        });

        return {
          message: `Successfully sent ${totalSentCount} items to ${actualTargetDepartment.name}`,
          sourceStatus: newSourceStatus,
          newInvoice,
          processRecords,
          remainingItems: invoiceResidueCount,
        };
      }
    );

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error sending product to department:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
