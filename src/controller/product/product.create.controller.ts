// product.controller.ts
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Define TypeScript interfaces for the request body
interface ColorSizeRequest {
  colorId: string;
  sizeId: string;
  quantity: number;
}

interface SizeGroupRequest {
  size: string;
  quantity: number;
  colorSizes: ColorSizeRequest[];
}

interface ProductSettingRequest {
  totalCount: number;
  sizeGroups: SizeGroupRequest[];
}

interface ProductPackRequest {
  invoiceId: string; // Required: ID of existing invoice
  productSettings: ProductSettingRequest[];
}

interface ProductRequest {
  name: string;
  productPacks: ProductPackRequest[];
}

// Request can be a single product or an array of products
type ProductsRequest = ProductRequest | ProductRequest[];

export const createProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productsData: ProductsRequest = req.body;

    // Convert to array if single product
    const productArray: ProductRequest[] = Array.isArray(productsData) ? productsData : [productsData];

    const createdProducts = [];

    // Process each product in sequence to ensure proper connections
    for (const productData of productArray) {
      // 1. First create the product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
        }
      });

      // 2. For each product pack, create it and connect to the product and invoice
      for (const pack of productData.productPacks) {
        // Verify invoice exists
        const invoice = await prisma.invoice.findUnique({
          where: { id: pack.invoiceId }
        });

        if (!invoice) {
          throw new Error(`Invoice with ID ${pack.invoiceId} not found`);
        }

        // Create the product pack
        const productPack = await prisma.productPack.create({
          data: {
            Product: { connect: { id: product.id } },
            Invoice: { connect: { id: pack.invoiceId } }
          }
        });

        // 3. Create product settings and connect them to both product and product pack
        for (const setting of pack.productSettings) {
          await prisma.productSetting.create({
            data: {
              totalCount: setting.totalCount,
              product: { connect: { id: product.id } },
              productPack: { connect: { id: productPack.id } },
              sizeGroups: {
                create: setting.sizeGroups.map((group) => ({
                  size: group.size,
                  quantity: group.quantity,
                  colorSizes: {
                    create: group.colorSizes.map((colorSize) => ({
                      quantity: colorSize.quantity,
                      color: { connect: { id: colorSize.colorId } },
                      size: { connect: { id: colorSize.sizeId } }
                    }))
                  }
                }))
              }
            }
          });
        }
      }

      // Fetch the complete product with all its relations
      const completedProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          ProductPack: {
            include: {
              Invoice: true,
              productSettings: {
                include: {
                  sizeGroups: {
                    include: {
                      colorSizes: {
                        include: {
                          color: true,
                          size: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      createdProducts.push(completedProduct);
    }

    return res.status(201).json({
      success: true,
      data: createdProducts
    });
  } catch (error) {
    console.error('Error creating products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
