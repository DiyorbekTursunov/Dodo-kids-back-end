import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create a complex product with multiple product types, sizes, and colors
 */
export const createProduct = async (req: Request, res: Response) => {
  const { productTypes } = req.body;

  try {
    // Input validation
    if (!productTypes || !Array.isArray(productTypes) || productTypes.length === 0) {
      return res.status(400).json({ error: "At least one product type is required" });
    }

    // Create product with nested relations
    const product = await prisma.product.create({
      data: {
        productTypes: {
          create: productTypes.map((productType: any) => ({
            name: productType.name,
            material: productType.material,
            sizeGroups: {
              create: productType.sizeGroups.map((sizeGroup: any) => ({
                size: sizeGroup.size,
                quantity: parseInt(sizeGroup.quantity),
                colorSizes: {
                  create: sizeGroup.colors.map((color: any) => {
                    // Check if color already exists
                    return {
                      quantity: parseInt(color.quantity),
                      color: {
                        connectOrCreate: {
                          where: { name: color.name.toLowerCase() },
                          create: { name: color.name.toLowerCase() }
                        }
                      }
                    };
                  })
                }
              }))
            }
          }))
        }
      },
      include: {
        productTypes: {
          include: {
            sizeGroups: {
              include: {
                colorSizes: {
                  include: {
                    color: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
};

/**
 * Get product by id with all nested relations
 */
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productTypes: {
          include: {
            sizeGroups: {
              include: {
                colorSizes: {
                  include: {
                    color: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
};

/**
 * Get all products with nested relations
 */
export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        productTypes: {
          include: {
            sizeGroups: {
              include: {
                colorSizes: {
                  include: {
                    color: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
};

/**
 * Update a product and its nested relations
 */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { productTypes } = req.body;

  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        productTypes: {
          include: {
            sizeGroups: {
              include: {
                colorSizes: true
              }
            }
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete existing relations to replace them
    // This is a simple approach - a more sophisticated one would update existing records
    await prisma.$transaction([
      ...existingProduct.productTypes.flatMap(pt =>
        pt.sizeGroups.map(sg =>
          prisma.productColorSize.deleteMany({
            where: { sizeGroupId: sg.id }
          })
        )
      ),
      ...existingProduct.productTypes.map(pt =>
        prisma.sizeGroup.deleteMany({
          where: { productTypeId: pt.id }
        })
      ),
      prisma.productType.deleteMany({
        where: { productId: id }
      })
    ]);

    // Create new relations
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        productTypes: {
          create: productTypes.map((productType: any) => ({
            name: productType.name,
            material: productType.material,
            sizeGroups: {
              create: productType.sizeGroups.map((sizeGroup: any) => ({
                size: sizeGroup.size,
                quantity: parseInt(sizeGroup.quantity),
                colorSizes: {
                  create: sizeGroup.colors.map((color: any) => {
                    return {
                      quantity: parseInt(color.quantity),
                      color: {
                        connectOrCreate: {
                          where: { name: color.name.toLowerCase() },
                          create: { name: color.name.toLowerCase() }
                        }
                      }
                    };
                  })
                }
              }))
            }
          }))
        }
      },
      include: {
        productTypes: {
          include: {
            sizeGroups: {
              include: {
                colorSizes: {
                  include: {
                    color: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
};

/**
 * Delete a product and all its nested relations
 */
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
};
