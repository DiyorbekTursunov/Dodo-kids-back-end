import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
});

// Department flow map for validation
const departmentFlowMap: Record<string, string[]> = {
  bichuv: ["tasnif"],
  tasnif: ["pechat", "pechatusluga"],
  pechat: ["vishivka", "vishivkausluga"],
  pechatusluga: ["vishivka", "vishivkausluga"],
  vishivka: ["tikuv", "tikuvusluga"],
  vishivkausluga: ["tikuv", "tikuvusluga"],
  tikuv: ["chistka"],
  tikuvusluga: ["chistka"],
  chistka: ["kontrol"],
  kontrol: ["dazmol"],
  dazmol: ["upakovka"],
  upakovka: ["ombor"],
  ombor: [],
};

const normalizeDepartment = (name: string): string => {
  const map: Record<string, string> = {
    autsorspechat: "pechat",
    autsorstikuv: "tikuv",
    pechatusluga: "pechatusluga",
    vishivkausluga: "vishivkausluga",
    tikuvusluga: "tikuvusluga",
  };
  return map[name.toLowerCase()] || name.toLowerCase();
};

interface ColorSizeData {
  colorId: string;
  sizeId: string;
  sendedCount: number;
  invalidCount?: number;
}

interface ProductData {
  productId: string;
  sendedCount: number;
  invalidCount?: number;
  colorSizes: ColorSizeData[];
}

interface RequestBody {
  invoiceId: string;
  targetDepartmentId: string;
  employeeId: string;
  outsourseCompanyId?: string;
  invalidReason?: string;
  products: ProductData[];
}

// Transformation function to shape the response
const transformInvoice = (invoice: any) => {
  return {
    id: invoice.id,
    number: invoice.number,
    perentId: invoice.perentId,
    protsessIsOver: invoice.protsessIsOver,
    departmentId: invoice.departmentId,
    department: invoice.department,
    totalCount: invoice.totalCount,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    productGroup: {
      id: invoice.productGroup.id,
      name: invoice.productGroup.name,
      isSended: invoice.productGroup.isSended,
      processes: invoice.productGroup.processes.map((process: any) => ({
        department: { id: process.departmentId, name: process.departmentName },
        totalCount: process.totalCount,
        acceptCount: process.acceptCount,
        sendedCount: process.sendedCount,
        invalidCount: process.invalidCount,
        residueCount: process.residueCount,
        status: process.status,
      })),
      products: invoice.productGroup.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        isSended: product.isSended,
        processes: product.processes.map((process: any) => ({
          department: {
            id: process.departmentId,
            name: process.departmentName,
          },
          totalCount: process.totalCount,
          acceptCount: process.acceptCount,
          sendedCount: process.sendedCount,
          invalidCount: process.invalidCount,
          residueCount: process.residueCount,
          status: process.status,
        })),
        sizes: product.productSettings.flatMap((setting: any) =>
          setting.sizeGroups.map((sizeGroup: any) => ({
            id: sizeGroup.id,
            size: { id: sizeGroup.size?.id, name: sizeGroup.size?.name },
            isSended: sizeGroup.isSended,
            totalCount: sizeGroup.quantity,
            status: sizeGroup.status,
            colors: sizeGroup.colorSizes.map((colorSize: any) => ({
              id: colorSize.id,
              totalCount: colorSize.quantity,
              isSended: colorSize.isSended,
              status: colorSize.status,
              color: { id: colorSize.color.id, name: colorSize.color.name },
              size: { id: colorSize.size.id, name: colorSize.size.name },
              processes: colorSize.processes.map((process: any) => ({
                department: {
                  id: process.departmentId,
                  name: process.departmentName,
                },
                totalCount: process.totalCount,
                acceptCount: process.acceptCount,
                sendedCount: process.sendedCount,
                invalidCount: process.invalidCount,
                residueCount: process.residueCount,
                status: process.status,
              })),
            })),
          }))
        ),
      })),
      productGroupFiles: invoice.productGroup.productGroupFiles.map(
        (file: any) => ({
          id: file.id,
          file: {
            id: file.file.id,
            fileName: file.file.fileName,
            path: file.file.path,
            mimeType: file.file.mimeType,
            size: file.file.size,
            fileType: file.file.fileType,
          },
        })
      ),
    },
    status: invoice.status.map((status: any) => ({
      id: status.id,
      status: status.status,
      date: status.date,
      protsessIsOver: status.protsessIsOver,
      acceptCount: status.acceptCount,
      sendedCount: status.sendedCount,
      invalidCount: status.invalidCount,
      residueCount: status.residueCount,
      invalidReason: status.invalidReason,
      department: { id: status.department.id, name: status.department.name },
      outsourseName: status.outsourseName,
      isOutsourseCompany: status.isOutsourseCompany,
    })),
  };
};

export const sendProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    invoiceId,
    targetDepartmentId,
    employeeId,
    outsourseCompanyId,
    invalidReason = "",
    products,
  } = req.body as RequestBody;

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
                processes: true,
                productSettings: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: {
                          include: { processes: true, color: true, size: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            productGroupFiles: { include: { file: true } },
            invoices: { include: { status: true } },
            processes: true,
          },
        },
      },
    });

    if (!sourceInvoice) {
      return res.status(404).json({ error: "Source invoice not found" });
    }

    // Fetch target department and outsourse company (if provided)
    const [targetDepartment, outsourseCompany] = await Promise.all([
      prisma.department.findUnique({ where: { id: targetDepartmentId } }),
      outsourseCompanyId
        ? prisma.outsourseCompany.findUnique({
            where: { id: outsourseCompanyId },
          })
        : Promise.resolve(null),
    ]);

    if (!targetDepartment) {
      return res.status(404).json({ error: "Target department not found" });
    }

    if (outsourseCompanyId && !outsourseCompany) {
      return res.status(404).json({ error: "Outsourse company not found" });
    }

    // Validate department flow
    const sourceDeptName = normalizeDepartment(sourceInvoice.department);
    const targetDeptName = normalizeDepartment(targetDepartment.name);
    if (!departmentFlowMap[sourceDeptName]?.includes(targetDeptName)) {
      return res.status(400).json({
        error: `Invalid department transition: ${sourceInvoice.department} cannot send to ${targetDepartment.name}`,
      });
    }

    // Handle "avsors" redirect to "chistka"
    let actualTargetDepartment = targetDepartment;
    if (targetDepartment.name.toLowerCase() === "avsors") {
      const chistkaDepartment = await prisma.department.findFirst({
        where: { name: { equals: "chistka", mode: "insensitive" } },
      });
      if (!chistkaDepartment) {
        return res.status(404).json({ error: "Chistka department not found" });
      }
      actualTargetDepartment = chistkaDepartment;
    }

    // Transaction for process updates
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Check for existing target invoice
        const existingInvoice = await tx.invoice.findFirst({
          where: {
            productGroupId: sourceInvoice.productGroupId,
            departmentId: actualTargetDepartment.id,
            protsessIsOver: false,
          },
          include: { ProductProcess: true, status: true, productGroup: true },
        });

        let targetInvoice = existingInvoice;
        let totalSentCount = 0;
        let totalInvalidCount = 0;

        if (!targetInvoice) {
          targetInvoice = await tx.invoice.create({
            data: {
              perentId: sourceInvoice.perentId,
              number: await getNextInvoiceNumber(tx),
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
                  isOutsourseCompany: !!outsourseCompany,
                  outsourseCompanyId: outsourseCompany?.id,
                  outsourseName: outsourseCompany?.name ?? null,
                  totalCount: 0,
                },
              },
            },
            include: { ProductProcess: true, status: true, productGroup: true },
          });
        }

        if (!targetInvoice) {
          throw new Error("Failed to create or find target invoice");
        }

        for (const productData of products) {
          const {
            productId,
            sendedCount,
            invalidCount = 0,
            colorSizes,
          } = productData;

          if (
            !productId ||
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
            (sum: number, p: any) => sum + p.sendedCount,
            0
          );
          const productInvalidCount = product.processes.reduce(
            (sum: number, p: any) => sum + p.invalidCount,
            0
          );
          const availableProductCount =
            product.allTotalCount - productSentCount - productInvalidCount;

          if (sendedCount + invalidCount > availableProductCount) {
            throw new Error(
              `Cannot send ${
                sendedCount + invalidCount
              } items for product ${productId}; only ${availableProductCount} available`
            );
          }

          // Calculate acceptCount
          const acceptCount = sendedCount;

          // Update or create ProductProcess
          let productProcess = targetInvoice.ProductProcess?.find(
            (pp) => pp.productId === productId
          );

          if (productProcess) {
            productProcess = await tx.productProcess.update({
              where: { id: productProcess.id },
              data: {
                sendedCount: productProcess.sendedCount + sendedCount,
                invalidCount: productProcess.invalidCount + invalidCount,
                invalidReason,
                residueCount:
                  availableProductCount -
                  (productProcess.sendedCount + sendedCount) -
                  (productProcess.invalidCount + invalidCount),
                totalCount: availableProductCount,
                acceptCount: productProcess.acceptCount + acceptCount,
                protsessIsOver:
                  productProcess.sendedCount +
                    sendedCount +
                    productProcess.invalidCount +
                    invalidCount ===
                  availableProductCount,
                status:
                  productProcess.sendedCount +
                    sendedCount +
                    productProcess.invalidCount +
                    invalidCount ===
                  availableProductCount
                    ? "Yuborilgan"
                    : "ToliqYuborilmagan",
              },
            });
          } else {
            productProcess = await tx.productProcess.create({
              data: {
                protsessIsOver:
                  sendedCount + invalidCount === availableProductCount,
                status:
                  sendedCount + invalidCount === availableProductCount
                    ? "Yuborilgan"
                    : "ToliqYuborilmagan",
                employeeId,
                departmentName: actualTargetDepartment.name,
                departmentId: actualTargetDepartment.id,
                acceptCount,
                sendedCount,
                invalidCount,
                invalidReason,
                residueCount: availableProductCount - sendedCount - invalidCount,
                totalCount: availableProductCount,
                productId,
                invoiceId: targetInvoice.id,
              },
            });
          }

          totalSentCount += sendedCount;
          totalInvalidCount += invalidCount;

          // Validate color size totals
          const colorSizeTotalSent = colorSizes.reduce(
            (sum: number, cs: ColorSizeData) => sum + cs.sendedCount,
            0
          );
          const colorSizeTotalInvalid = colorSizes.reduce(
            (sum: number, cs: ColorSizeData) => sum + (cs.invalidCount ?? 0),
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
              colorId,
              sizeId,
              sendedCount: csSendedCount,
              invalidCount: csInvalidCount = 0,
            } = colorSizeData;

            if (
              !colorId ||
              !sizeId ||
              !Number.isInteger(csSendedCount) ||
              !Number.isInteger(csInvalidCount)
            ) {
              throw new Error(
                `Invalid color size data for colorId: ${colorId}, sizeId: ${sizeId}`
              );
            }

            // Find ProductColorSize by colorId and sizeId
            let colorSize;
            for (const setting of product.productSettings) {
              for (const sizeGroup of setting.sizeGroups) {
                colorSize = sizeGroup.colorSizes.find(
                  (cs: any) => cs.colorId === colorId && cs.sizeId === sizeId
                );
                if (colorSize) break;
              }
              if (colorSize) break;
            }

            if (!colorSize) {
              throw new Error(
                `ColorSize with colorId: ${colorId} and sizeId: ${sizeId} not found`
              );
            }

            const colorSizeSentCount =
              colorSize.processes?.reduce(
                (sum: number, p: any) => sum + p.sendedCount,
                0
              ) || 0;
            const colorSizeInvalidCount =
              colorSize.processes?.reduce(
                (sum: number, p: any) => sum + p.invalidCount,
                0
              ) || 0;
            const availableColorSizeCount =
              colorSize.quantity - colorSizeSentCount - colorSizeInvalidCount;

            if (csSendedCount + csInvalidCount > availableColorSizeCount) {
              throw new Error(
                `Cannot send ${
                  csSendedCount + csInvalidCount
                } items for color size (colorId: ${colorId}, sizeId: ${sizeId}); only ${availableColorSizeCount} available`
              );
            }

            const csAcceptCount = csSendedCount;

            await tx.colorSizeProcess.create({
              data: {
                protsessIsOver:
                  csSendedCount + csInvalidCount === availableColorSizeCount,
                status:
                  csSendedCount + csInvalidCount === availableColorSizeCount
                    ? "Yuborilgan"
                    : "ToliqYuborilmagan",
                employeeId,
                departmentName: actualTargetDepartment.name,
                departmentId: actualTargetDepartment.id,
                acceptCount: csAcceptCount,
                sendedCount: csSendedCount,
                invalidCount: csInvalidCount,
                invalidReason,
                residueCount:
                  availableColorSizeCount - csSendedCount - csInvalidCount,
                colorSizeId: colorSize.id,
                productProcessId: productProcess.id,
              },
            });

            const isFullySent =
              csSendedCount + csInvalidCount === availableColorSizeCount;
            await tx.productColorSize.update({
              where: { id: colorSize.id },
              data: {
                isSended: isFullySent,
                status: isFullySent ? "Yuborilgan" : "ToliqYuborilmagan",
              },
            });

            // Update SizeGroup status
            const sizeGroup = product.productSettings
              .flatMap((setting: any) => setting.sizeGroups)
              .find((sg: any) => sg.id === colorSize.sizeGroupId);
            if (sizeGroup) {
              const sizeGroupColorSizes = await tx.productColorSize.findMany({
                where: { sizeGroupId: sizeGroup.id },
                select: { isSended: true },
              });
              const sizeGroupFullySent = sizeGroupColorSizes.every(
                (cs: any) => cs.isSended
              );
              await tx.sizeGroup.update({
                where: { id: sizeGroup.id },
                data: {
                  isSended: sizeGroupFullySent,
                  status: sizeGroupFullySent ? "Yuborilgan" : "ToliqYuborilmagan",
                },
              });
            }

            // Update ProductSetting status
            const productSetting = product.productSettings.find((ps: any) =>
              ps.sizeGroups.some((sg: any) => sg.id === colorSize.sizeGroupId)
            );
            if (productSetting) {
              const productSettingSizeGroups = await tx.sizeGroup.findMany({
                where: { productSettingId: productSetting.id },
                select: { isSended: true },
              });
              const productSettingFullySent = productSettingSizeGroups.every(
                (sg: any) => sg.isSended
              );
              await tx.productSetting.update({
                where: { id: productSetting.id },
                data: {
                  isSended: productSettingFullySent,
                  status: productSettingFullySent ? "Yuborilgan" : "ToliqYuborilmagan",
                },
              });
            }
          }

          const remainingProductCount =
            availableProductCount - sendedCount - invalidCount;
          await tx.product.update({
            where: { id: productId },
            data: {
              isSended: remainingProductCount === 0,
              status: remainingProductCount === 0 ? "Yuborilgan" : "ToliqYuborilmagan",
            },
          });
        }

        // Update ProductGroup status
        const productGroupProducts = await tx.product.findMany({
          where: { productGroupId: sourceInvoice.productGroupId },
          select: { isSended: true },
        });
        const productGroupFullySent = productGroupProducts.every(
          (p: any) => p.isSended
        );
        await tx.productGroup.update({
          where: { id: sourceInvoice.productGroupId },
          data: {
            isSended: productGroupFullySent,
            status: productGroupFullySent ? "Yuborilgan" : "ToliqYuborilmagan",
          },
        });

        // Update source invoice status
        const totalInvoiceCount = sourceInvoice.totalCount;
        const invoiceSentCount = sourceInvoice.status.reduce(
          (sum: number, s: any) => sum + s.sendedCount,
          0
        );
        const invoiceInvalidCount = sourceInvoice.status.reduce(
          (sum: number, s: any) => sum + s.invalidCount,
          0
        );
        const newInvoiceSentCount = invoiceSentCount + totalSentCount;
        const newInvoiceInvalidCount = invoiceInvalidCount + totalInvalidCount;
        const invoiceResidueCount =
          totalInvoiceCount - newInvoiceSentCount - newInvoiceInvalidCount;

        await tx.productProtsess.create({
          data: {
            protsessIsOver:
              newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount,
            status:
              newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount
                ? "Yuborilgan"
                : "ToliqYuborilmagan",
            departmentName: actualTargetDepartment.name,
            departmentId: actualTargetDepartment.id,
            invoiceId,
            employeeId,
            acceptCount: totalSentCount,
            sendedCount: totalSentCount,
            residueCount: invoiceResidueCount,
            invalidCount: totalInvalidCount,
            invalidReason,
            date: new Date(),
            isOutsourseCompany: !!outsourseCompany,
            outsourseCompanyId: outsourseCompany?.id,
            outsourseName: outsourseCompany?.name ?? null,
            totalCount: totalInvoiceCount,
          },
        });

        if (
          newInvoiceSentCount + newInvoiceInvalidCount === totalInvoiceCount
        ) {
          await tx.invoice.update({
            where: { id: sourceInvoice.id },
            data: { protsessIsOver: true },
          });
        }

        // Update target invoice total count
        const updatedTotalCount =
          (existingInvoice?.totalCount || 0) + totalSentCount;
        await tx.invoice.update({
          where: { id: targetInvoice.id },
          data: { totalCount: updatedTotalCount },
        });

        return targetInvoice.id;
      }
    );

    // Fetch updated target invoice outside the transaction
    const updatedTargetInvoice = await prisma.invoice.findUnique({
      where: { id: result },
      include: {
        status: {
          include: { department: true },
          orderBy: { createdAt: "desc" },
        },
        productGroup: {
          include: {
            products: {
              include: {
                processes: {
                  select: {
                    id: true,
                    status: true,
                    employeeId: true,
                    departmentId: true,
                    departmentName: true,
                    acceptCount: true,
                    sendedCount: true,
                    invalidCount: true,
                    invalidReason: true,
                    residueCount: true,
                    totalCount: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                productSettings: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: {
                          include: { processes: true, color: true, size: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            productGroupFiles: { include: { file: true } },
            invoices: {
              include: {
                status: {
                  select: {
                    id: true,
                    status: true,
                    departmentId: true,
                    departmentName: true,
                    acceptCount: true,
                    sendedCount: true,
                    invalidCount: true,
                    residueCount: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
            processes: true,
          },
        },
      },
    });

    if (!updatedTargetInvoice) {
      return res
        .status(404)
        .json({ error: "Updated target invoice not found" });
    }

    // Transform and send response
    const transformedInvoice = transformInvoice(updatedTargetInvoice);
    return res.status(200).json({
      data: [transformedInvoice],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  } catch (err) {
    console.error("Error sending product to department:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });


  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Retrieves the next available invoice number.
 * @param tx - Prisma transaction client
 * @returns Promise<number> - The next invoice number
 */
async function getNextInvoiceNumber(tx: Prisma.TransactionClient): Promise<number> {
  const lastInvoice = await tx.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (lastInvoice?.number || 0) + 1;
}
