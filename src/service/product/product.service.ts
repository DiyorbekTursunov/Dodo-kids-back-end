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
  status: ProductProtsessStatus;
}

interface SizeGroupInput {
  sizeId: string;
  quantity: number;
  status: ProductProtsessStatus;
  colorSizes: ColorSizeInput[];
}

interface ProductSettingInput {
  totalCount: number;
  status: ProductProtsessStatus;
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
  productSettings: ProductSettingInput[];
}

interface FileInput {
  id: string;
}

interface CreateProductGroupInput {
  name: string;
  isSended: boolean;
  files: FileInput[];
  products: ProductInput[];
}

// Function to create a ProductGroup with nested Products and associated Files
export async function createProductGroup(
  data: CreateProductGroupInput
): Promise<ProductGroup> {
  // Collect all sizeIds and colorIds from the input
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
      status: "Default",
      productGroupFiles: {
        create: data.files.map((file) => ({
          file: { connect: { id: file.id } },
          status: "Default", // Default status for ProductGroupFile
          isSended: false, // Default value
        })),
      },
      products: {
        create: data.products.map((product) => ({
          name: product.name,
          allTotalCount: product.allTotalCount,
          status: "Default",
          productSettings: {
            create: product.productSettings.map((setting) => ({
              totalCount: setting.totalCount,
              status: "Default",
              sizeGroups: {
                create: setting.sizeGroups.map((sizeGroup) => ({
                  size: { connect: { id: sizeGroup.sizeId } },
                  quantity: sizeGroup.quantity,
                  status: "Default",
                  colorSizes: {
                    create: sizeGroup.colorSizes.map((colorSize) => ({
                      color: { connect: { id: colorSize.colorId } },
                      quantity: colorSize.quantity,
                      status: "Default",
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
