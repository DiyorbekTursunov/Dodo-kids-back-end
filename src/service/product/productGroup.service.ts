import { PrismaClient, ProductGroup } from "@prisma/client";
import {
  ProductGroupRequest,
  ProductsArrayRequest,
  ColorSizeRequest,
} from "../../types/product/product.interface";

const prisma = new PrismaClient();

export const validateColorSizes = async (
  colorSizes: ColorSizeRequest[]
): Promise<void> => {
  const colorIds = [...new Set(colorSizes.map((cs) => cs.colorId))];
  const sizeIds = [...new Set(colorSizes.map((cs) => cs.sizeId))];

  const colors = await prisma.color.findMany({
    where: { id: { in: colorIds } },
  });
  const sizes = await prisma.size.findMany({ where: { id: { in: sizeIds } } });

  for (const colorSize of colorSizes) {
    if (!colors.find((c) => c.id === colorSize.colorId)) {
      throw new Error(`Color with ID ${colorSize.colorId} does not exist`);
    }
    if (!sizes.find((s) => s.id === colorSize.sizeId)) {
      throw new Error(`Size with ID ${colorSize.sizeId} does not exist`);
    }
    if (colorSize.quantity < 0) {
      throw new Error(`Quantity cannot be negative for colorSize`);
    }
  }
};

export const createProductGroups = async (
  data: ProductsArrayRequest
): Promise<ProductGroup[]> => {
  const { productGroups } = data;
  if (!productGroups?.length) {
    throw new Error("productGroups array is required");
  }

  const createdProductGroups: ProductGroup[] = [];

  for (const productGroupData of productGroups) {
    if (!productGroupData.products || productGroupData.products.length === 0) {
      throw new Error("Products are required for product group");
    }

    // Extract file IDs from the files array
    const fileIds = productGroupData.files?.map((file) => file.id) || [];
    if (fileIds.length) {
      const files = await prisma.file.findMany({
        where: { id: { in: fileIds } },
      });
      if (files.length !== fileIds.length) {
        throw new Error("One or more files do not exist");
      }
    }

    for (const product of productGroupData.products) {
      const totalSettingsCount = product.productSettings.reduce(
        (sum, setting) => sum + setting.totalCount,
        0
      );
      if (totalSettingsCount > product.allTotalCount) {
        throw new Error(
          `Product settings total count exceeds allTotalCount for product ${product.name}`
        );
      }

      for (const setting of product.productSettings) {
        for (const group of setting.sizeGroups) {
          await validateColorSizes(group.colorSizes);
          const colorSizesTotal = group.colorSizes.reduce(
            (sum, cs) => sum + cs.quantity,
            0
          );
          if (colorSizesTotal > group.quantity) {
            throw new Error(
              `Color sizes quantity exceeds size group quantity for size ${group.size}`
            );
          }
        }
      }
    }

    const productGroup = await prisma.productGroup.create({
      data: {
        name: productGroupData.name,
        status: productGroupData.status ?? "Pending",
        productGroupFiles: {
          create: fileIds.map((fileId: string) => ({
            file: { connect: { id: fileId } },
            status: "Pending",
          })),
        },
        products: {
          create: productGroupData.products.map((product) => ({
            name: product.name,
            allTotalCount: product.allTotalCount,
            status: product.status ?? "Pending",
            productSetting: {
              create: product.productSettings.map((setting) => ({
                totalCount: setting.totalCount,
                status: setting.status ?? "Pending",
                sizeGroups: {
                  create: setting.sizeGroups.map((group) => ({
                    size: group.size,
                    quantity: group.quantity,
                    status: group.status ?? "Pending",
                    colorSizes: {
                      create: group.colorSizes.map((colorSize) => ({
                        quantity: colorSize.quantity,
                        status: colorSize.status ?? "Pending",
                        color: { connect: { id: colorSize.colorId } },
                        size: { connect: { id: colorSize.sizeId } },
                      })),
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        productGroupFiles: { include: { file: true } },
        products: {
          include: {
            productSetting: {
              include: {
                sizeGroups: {
                  include: {
                    colorSizes: {
                      include: { color: true, size: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    createdProductGroups.push(productGroup);
  }

  return createdProductGroups;
};

export const getAllProductGroups = async (): Promise<ProductGroup[]> => {
  return prisma.productGroup.findMany({
    include: {
      productGroupFiles: { include: { file: true } },
      products: {
        include: {
          productSetting: {
            include: {
              sizeGroups: {
                include: {
                  colorSizes: {
                    include: { color: true, size: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

export const getProductGroupById = async (
  id: string
): Promise<ProductGroup | null> => {
  return prisma.productGroup.findUnique({
    where: { id },
    include: {
      productGroupFiles: { include: { file: true } },
      products: {
        include: {
          productSetting: {
            include: {
              sizeGroups: {
                include: {
                  colorSizes: {
                    include: { color: true, size: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

export const updateProductGroup = async (
  id: string,
  data: Partial<ProductGroupRequest>
): Promise<ProductGroup> => {
  const existingGroup = await prisma.productGroup.findUnique({ where: { id } });
  if (!existingGroup) {
    throw new Error("Product group not found");
  }

  return prisma.productGroup.update({
    where: { id },
    data: {
      name: data.name,
      status: data.status,
    },
    include: {
      productGroupFiles: { include: { file: true } },
      products: {
        include: {
          productSetting: {
            include: {
              sizeGroups: {
                include: {
                  colorSizes: {
                    include: { color: true, size: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

export const deleteProductGroup = async (
  id: string,
  force: boolean = false
): Promise<void> => {
  const productGroup = await prisma.productGroup.findUnique({
    where: { id },
    include: {
      invoices: true,
      products: { include: { productSetting: true } },
    },
  });

  if (!productGroup) {
    throw new Error("Product group not found");
  }

  if (productGroup.invoices.length > 0 && !force) {
    throw new Error(
      "Cannot delete product group with associated invoices. Use force=true to delete all related data."
    );
  }

  await prisma.$transaction(async (tx) => {
    if (force && productGroup.invoices.length > 0) {
      const invoiceIds = productGroup.invoices.map((invoice) => invoice.id);
      await tx.productProtsess.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });
      await tx.invoice.deleteMany({ where: { productGroupId: id } });
    }

    const productSettingIds = productGroup.products
      .flatMap((product) => product.productSetting)
      .map((setting) => setting.id);

    await tx.productColorSize.deleteMany({
      where: {
        sizeGroup: {
          productSettingId: { in: productSettingIds },
        },
      },
    });
    await tx.sizeGroup.deleteMany({
      where: { productSettingId: { in: productSettingIds } },
    });
    await tx.productSetting.deleteMany({
      where: { productId: { in: productGroup.products.map((p) => p.id) } },
    });
    await tx.product.deleteMany({ where: { productGroupId: id } });
    await tx.productGroupFile.deleteMany({ where: { productGroupId: id } });
    await tx.productGroup.delete({ where: { id } });
  });
};
