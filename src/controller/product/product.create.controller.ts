import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface FileRequest {
  id: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

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
  files: FileRequest[];
  sizeGroups: SizeGroupRequest[];
  productPackId?: string;
}
interface ProductRequest {
  name: string;
  allTotalCount: number; // Added this field
  productSettings: ProductSettingRequest[];
}

interface ProductGroupRequest {
  name: string; // "A1", "A2", "A3"
  id: string; // might be empty
  products: ProductRequest[];
}

interface ProductsArrayRequest {
  products: ProductGroupRequest[];
}

export const createProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { products } = req.body;

    const createdProductGroups = [];

    for (const productGroupData of products) {
      const productGroup = await prisma.productGroup.create({
        data: {
          name: productGroupData.name,
          products: {
            create: productGroupData.products.map(
              (productData: ProductRequest) => ({
                name: productData.name,
                allTotalCount: productData.allTotalCount,
                productSetting: {
                  create: productData.productSettings.map(
                    (setting: ProductSettingRequest) => ({
                      totalCount: setting.totalCount,
                      productPack: setting.productPackId
                        ? { connect: { id: setting.productPackId } }
                        : undefined,
                      files: {
                        create: setting.files.map((file) => ({
                          file: { connect: { id: file.id } },
                        })),
                      },
                      sizeGroups: {
                        create: setting.sizeGroups.map((group) => ({
                          size: group.size,
                          quantity: group.quantity,
                          colorSizes: {
                            create: group.colorSizes.map((colorSize) => ({
                              quantity: colorSize.quantity,
                              color: { connect: { id: colorSize.colorId } },
                              size: { connect: { id: colorSize.sizeId } },
                            })),
                          },
                        })),
                      },
                    })
                  ),
                },
              })
            ),
          },
        },
        // ADD INCLUDE TO GET FULL DATA IN RESPONSE
        include: {
          products: {
            include: {
              productSetting: {
                include: {
                  files: {
                    include: {
                      file: true,
                    },
                  },
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
                  productPack: {
                    include: {
                      Invoice: true,
                      Product: true,
                    },
                  },
                },
              },
              ProductPack: true,
              Invoice: true,
            },
          },
        },
      });

      createdProductGroups.push(productGroup);
    }

    return res.status(201).json({
      success: true,
      data: createdProductGroups,
    });
  } catch (error) {
    console.error("Error creating products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all product groups with their products
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const productGroups = await prisma.productGroup.findMany({
      include: {
        products: {
          include: {
            productSetting: {
              include: {
                files: {
                  include: {
                    file: true,
                  },
                },
                sizeGroups: {
                  include: {
                    colorSizes: { // This is the correct field name, not "colorsG"
                      include: {
                        color: true,
                        size: true,
                      },
                    },
                  },
                },
                productPack: {
                  include: {
                    Invoice: true,
                    Product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: productGroups,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a single product by ID
export const getProductById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productGroup: true,
        productSetting: {
          include: {
            files: {
              include: {
                file: true,
              },
            },
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
            productPack: true,
          },
        },
        ProductPack: true,
        Invoice: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a product group by ID
export const getProductGroupById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const productGroup = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            productSetting: {
              include: {
                files: {
                  include: {
                    file: true,
                  },
                },
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
                productPack: true,
              },
            },
          },
        },
      },
    });

    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: productGroup,
    });
  } catch (error) {
    console.error("Error fetching product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update product settings for a specific product
export const updateProductSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params; // Product ID
    const { productSettings }: { productSettings: ProductSettingRequest[] } =
      req.body;

    // Validate input
    if (!productSettings || !Array.isArray(productSettings)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: productSettings array is required",
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete existing product settings and related data
    await prisma.productSetting.deleteMany({
      where: { productId: id },
    });

    // Create new product settings
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        productSetting: {
          create: productSettings.map((setting) => ({
            totalCount: setting.totalCount,
            productPack: setting.productPackId
              ? { connect: { id: setting.productPackId } }
              : undefined,
            files: {
              create: setting.files.map((file) => ({
                file: {
                  connect: { id: file.id },
                },
              })),
            },
            sizeGroups: {
              create: setting.sizeGroups.map((group) => ({
                size: group.size,
                quantity: group.quantity,
                colorSizes: {
                  create: group.colorSizes.map((colorSize) => ({
                    quantity: colorSize.quantity,
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
            files: {
              include: {
                file: true,
              },
            },
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
            productPack: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product settings",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a product
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete product (cascades to productSetting and sizeGroups due to onDelete: Cascade)
    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a product group
export const deleteProductGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    // Verify product group exists
    const productGroup = await prisma.productGroup.findUnique({
      where: { id },
    });
    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    // Delete product group (will cascade to products and their settings)
    await prisma.productGroup.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Product group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a product pack
export const deleteProductPack = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    // Verify product pack exists
    const productPack = await prisma.productPack.findUnique({ where: { id } });
    if (!productPack) {
      return res.status(404).json({
        success: false,
        message: "Product pack not found",
      });
    }

    // Delete product pack (cascades to productSetting due to relation)
    await prisma.productPack.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Product pack deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product pack:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product pack",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
