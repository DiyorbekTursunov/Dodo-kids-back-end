import { PrismaClient, Product, ProductProtsessStatus } from '@prisma/client';

const prisma = new PrismaClient();

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

interface CreateProductInput {
  name: string;
  allTotalCount: number;
  status: ProductProtsessStatus;
  productGroupId: string;
  productSettings: ProductSettingInput[];
}

interface UpdateProductInput {
  name?: string;
  allTotalCount?: number;
  status?: ProductProtsessStatus;
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const productGroup = await prisma.productGroup.findUnique({
    where: { id: data.productGroupId },
  });
  if (!productGroup) {
    throw new Error('Product group not found');
  }

  const sizeIds = new Set<string>();
  const colorIds = new Set<string>();
  for (const setting of data.productSettings) {
    for (const sizeGroup of setting.sizeGroups) {
      sizeIds.add(sizeGroup.sizeId);
      for (const colorSize of sizeGroup.colorSizes) {
        colorIds.add(colorSize.colorId);
      }
    }
  }

  const existingSizes = await prisma.size.findMany({
    where: { id: { in: Array.from(sizeIds) } },
  });
  if (existingSizes.length !== sizeIds.size) {
    throw new Error('One or more sizeIds do not exist');
  }

  const existingColors = await prisma.color.findMany({
    where: { id: { in: Array.from(colorIds) } },
  });
  if (existingColors.length !== colorIds.size) {
    throw new Error('One or more colorIds do not exist');
  }

  return prisma.product.create({
    data: {
      name: data.name,
      allTotalCount: data.allTotalCount,
      status: data.status,
      productGroup: {
        connect: { id: data.productGroupId },
      },
      productSettings: {
        create: data.productSettings.map(setting => ({
          totalCount: setting.totalCount,
          status: setting.status,
          sizeGroups: {
            create: setting.sizeGroups.map(sizeGroup => ({
              size: { connect: { id: sizeGroup.sizeId } },
              quantity: sizeGroup.quantity,
              status: sizeGroup.status,
              colorSizes: {
                create: sizeGroup.colorSizes.map(colorSize => ({
                  color: { connect: { id: colorSize.colorId } },
                  quantity: colorSize.quantity,
                  status: colorSize.status,
                  size: { connect: { id: sizeGroup.sizeId } },
                })),
              },
            })),
          },
        })),
      },
    },
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

export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
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
