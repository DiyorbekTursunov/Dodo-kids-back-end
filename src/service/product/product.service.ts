import { PrismaClient, Product, ProductProtsessStatus } from "@prisma/client";
import {
  ProductRequest,
  ProductSettingRequest,
} from "../../types/product/product.interface";
import { validateColorSizes } from "./productGroup.service";

const prisma = new PrismaClient();

export const createProduct = async (
  productGroupId: string,
  data: ProductRequest
): Promise<Product> => {
  const { name, allTotalCount, productSettings } = data;

  // Validate product group exists
  const productGroup = await prisma.productGroup.findUnique({
    where: { id: productGroupId },
  });
  if (!productGroup) {
    throw new Error("Product group not found");
  }

  // Validate total counts
  const totalSettingsCount = productSettings.reduce(
    (sum, setting) => sum + setting.totalCount,
    0
  );
  if (totalSettingsCount > allTotalCount) {
    throw new Error("Product settings total count exceeds allTotalCount");
  }

  // Validate colors, sizes, and size groups
  for (const setting of productSettings) {
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
    const sizeGroupsTotal = setting.sizeGroups.reduce(
      (sum, group) => sum + group.quantity,
      0
    );
    if (sizeGroupsTotal > setting.totalCount) {
      throw new Error(
        `Size groups quantity exceeds setting total count`
      );
    }
  }

  return prisma.product.create({
    data: {
      name,
      allTotalCount,
      productGroupId,
      status: ProductProtsessStatus.Pending,
      productSetting: {
        create: productSettings.map((setting: ProductSettingRequest) => ({
          totalCount: setting.totalCount,
          status: setting.status || ProductProtsessStatus.Pending,
          sizeGroups: {
            create: setting.sizeGroups.map((group) => ({
              size: group.size,
              quantity: group.quantity,
              status: group.status || ProductProtsessStatus.Pending,
              colorSizes: {
                create: group.colorSizes.map((colorSize) => ({
                  quantity: colorSize.quantity,
                  status: colorSize.status || ProductProtsessStatus.Pending,
                  color: { connect: { id: colorSize.colorId } },
                  size: { connect: { id: colorSize.sizeId } },
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      productGroup: {
        include: { productGroupFiles: { include: { file: true } } },
      },
      productSetting: {
        include: {
          sizeGroups: {
            include: { colorSizes: { include: { color: true, size: true } } },
          },
        },
      },
    },
  });
};

export const getProductById = async (id: string): Promise<Product | null> => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      productGroup: {
        include: { productGroupFiles: { include: { file: true } } },
      },
      productSetting: {
        include: {
          sizeGroups: {
            include: { colorSizes: { include: { color: true, size: true } } },
          },
        },
      },
    },
  });
};

export const updateProduct = async (
  id: string,
  data: Partial<ProductRequest>
): Promise<Product> => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new Error("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      allTotalCount: data.allTotalCount,
      ...(data.status && { status: data.status }),
    },
    include: {
      productGroup: {
        include: { productGroupFiles: { include: { file: true } } },
      },
      productSetting: {
        include: {
          sizeGroups: {
            include: { colorSizes: { include: { color: true, size: true } } },
          },
        },
      },
    },
  });
};

export const deleteProduct = async (id: string): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.product.delete({ where: { id } });
};

export const getAllProductsFlat = async (): Promise<Product[]> => {
  return prisma.product.findMany({
    include: {
      productGroup: {
        include: { productGroupFiles: { include: { file: true } } },
      },
      productSetting: {
        include: {
          sizeGroups: {
            include: { colorSizes: { include: { color: true, size: true } } },
          },
        },
      },
    },
  });
};

export const getProductsByGroupId = async (
  productGroupId: string
): Promise<Product[]> => {
  return prisma.product.findMany({
    where: { productGroupId },
    include: {
      productGroup: {
        include: { productGroupFiles: { include: { file: true } } },
      },
      productSetting: {
        include: {
          sizeGroups: {
            include: { colorSizes: { include: { color: true, size: true } } },
          },
        },
      },
    },
  });
};

export const updateProductSettings = async (
  productId: string,
  productSettings: ProductSettingRequest[]
): Promise<Product> => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  // Validate colors, sizes, and size groups
  for (const setting of productSettings) {
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
    const sizeGroupsTotal = setting.sizeGroups.reduce(
      (sum, group) => sum + group.quantity,
      0
    );
    if (sizeGroupsTotal > setting.totalCount) {
      throw new Error(
        `Size groups quantity exceeds setting total count`
      );
    }
  }

  await prisma.productSetting.deleteMany({ where: { productId } });

  return prisma.product.update({
    where: { id: productId },
    data: {
      productSetting: {
        create: productSettings.map((setting) => ({
          totalCount: setting.totalCount,
          status: setting.status || ProductProtsessStatus.Pending,
          sizeGroups: {
            create: setting.sizeGroups.map((group) => ({
              size: group.size,
              quantity: group.quantity,
              status: group.status || ProductProtsessStatus.Pending,
              colorSizes: {
                create: group.colorSizes.map((colorSize) => ({
                  quantity: colorSize.quantity,
                  status: colorSize.status || ProductProtsessStatus.Pending,
                  color: { connect: { id: colorSize.colorId } },
                  size: { connect: { id: colorSize.sizeId } },
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      productSetting: {
        include: {
          sizeGroups: {
            include: { colorSizes: { include: { color: true, size: true } } },
          },
        },
      },
    },
  });
};
