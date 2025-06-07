import {
  PrismaClient,
  Product,
  ProductGroup,
  ProductProtsessStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

// Input interfaces
interface ColorSizeInput {
  colorId: string;
  quantity: number;
  status?: ProductProtsessStatus; // Optional, defaults to Default
}

interface SizeGroupInput {
  sizeId: string;
  quantity: number;
  status?: ProductProtsessStatus; // Optional, defaults to Default
  colorSizes: ColorSizeInput[];
}

interface ProductSettingInput {
  totalCount: number;
  status?: ProductProtsessStatus; // Optional, defaults to Default
  sizeGroups: SizeGroupInput[];
}

interface UpdateProductInput {
  name?: string;
  allTotalCount?: number;
  status?: ProductProtsessStatus;
}

interface ProductInput {
  name: string;
  allTotalCount: number;
  status?: ProductProtsessStatus; // Optional, defaults to Default
  productSettings: ProductSettingInput[];
}

interface FileInput {
  id: string;
}

interface CreateProductGroupInput {
  name: string;
  status?: ProductProtsessStatus; // Optional, defaults to Default
  isSended?: boolean; // Optional, defaults to false
  files: FileInput[];
  products: ProductInput[];
}

// Function to create a ProductGroup with nested Products and associated Files
export async function createProductGroup(
  data: CreateProductGroupInput
): Promise<ProductGroup> {
  // Collect all sizeIds, colorIds, and fileIds from the input
  const sizeIds = new Set<string>();
  const colorIds = new Set<string>();
  const fileIds = new Set<string>();

  for (const product of data.products) {
    for (const setting of product.productSettings) {
      for (const sizeGroup of setting.sizeGroups) {
        sizeIds.add(sizeGroup.sizeId);
        for (const colorSize of sizeGroup.colorSizes) {
          colorIds.add(colorSize.colorId);
        }
      }
    }
  }

  for (const file of data.files) {
    fileIds.add(file.id);
  }

  // Validate sizeIds exist in the database
  const existingSizes = await prisma.size.findMany({
    where: { id: { in: Array.from(sizeIds) } },
  });
  if (existingSizes.length !== sizeIds.size) {
    throw new Error("One or more sizeIds do not exist");
  }

  // Validate colorIds exist in the database
  const existingColors = await prisma.color.findMany({
    where: { id: { in: Array.from(colorIds) } },
  });
  if (existingColors.length !== colorIds.size) {
    throw new Error("One or more colorIds do not exist");
  }

  // Validate fileIds exist in the database
  const existingFiles = await prisma.file.findMany({
    where: { id: { in: Array.from(fileIds) } },
  });
  if (existingFiles.length !== fileIds.size) {
    throw new Error("One or more fileIds do not exist");
  }

  // Create the ProductGroup with nested Products and associated Files
  return prisma.productGroup.create({
    data: {
      name: data.name,
      status: data.status || "Default", // Default to 'Default' if not provided
      productGroupFiles: {
        create: data.files.map((file) => ({
          file: { connect: { id: file.id } },
          status: "Pending", // Default status for ProductGroupFile
          isSended: data.isSended || false, // Default to false if not provided
        })),
      },
      products: {
        create: data.products.map((product) => ({
          name: product.name,
          allTotalCount: product.allTotalCount,
          status: product.status || "Pending", // Default to 'Pending' if not provided
          productSettings: {
            create: product.productSettings.map((setting) => ({
              totalCount: setting.totalCount,
              status: setting.status || "Pending", // Default to 'Pending' if not provided
              sizeGroups: {
                create: setting.sizeGroups.map((sizeGroup) => ({
                  size: { connect: { id: sizeGroup.sizeId } },
                  quantity: sizeGroup.quantity,
                  status: sizeGroup.status || "Pending", // Default to 'Pending' if not provided
                  colorSizes: {
                    create: sizeGroup.colorSizes.map((colorSize) => ({
                      color: { connect: { id: colorSize.colorId } },
                      quantity: colorSize.quantity,
                      status: colorSize.status || "Pending", // Default to 'Pending' if not provided
                      size: { connect: { id: sizeGroup.sizeId } },
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
      products: {
        include: {
          productSettings: {
            include: {
              sizeGroups: {
                include: { colorSizes: true },
              },
            },
          },
        },
      },
      productGroupFiles: {
        include: { file: true },
      },
    },
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  return prisma.product.findUnique({
    where: { id },
    include: {
      productSettings: {
        include: {
          sizeGroups: {
            include: { colorSizes: true },
          },
        },
      },
    },
  });
}

export async function getProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    include: { productGroup: true },
  });
}

export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<Product> {
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({
    where: { id },
  });
}

// Function to delete a ProductGroup by ID
export async function deleteProductGroup(id: string): Promise<ProductGroup> {
  // Check if the ProductGroup exists
  const existingProductGroup = await prisma.productGroup.findUnique({
    where: { id },
  });

  if (!existingProductGroup) {
    throw new Error("ProductGroup not found");
  }

  // Delete the ProductGroup (cascades to related records)
  return prisma.productGroup.delete({
    where: { id },
    include: {
      products: {
        include: {
          productSettings: {
            include: {
              sizeGroups: {
                include: { colorSizes: true },
              },
            },
          },
        },
      },
      productGroupFiles: {
        include: { file: true },
      },
    },
  });
}

export async function getAllProductGroups(): Promise<ProductGroup[]> {
  return prisma.productGroup.findMany({
    include: {
      products: {
        include: {
          productSettings: {
            include: {
              sizeGroups: {
                include: {
                  colorSizes: {
                    include: {
                      color: true,
                      size: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      productGroupFiles: {
        include: {
          file: true,
        },
      },
    },
  });
}
