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

// ============ PRODUCT GROUP RUD OPERATIONS ============

// Update a product group
export const updateProductGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string",
      });
    }

    // Verify product group exists
    const existingGroup = await prisma.productGroup.findUnique({ where: { id } });
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    // Update product group
    const updatedGroup = await prisma.productGroup.update({
      where: { id },
      data: { name },
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
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedGroup,
    });
  } catch (error) {
    console.error("Error updating product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ============ PRODUCT RUD OPERATIONS ============

// Create a single product within a product group
export const createProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { productGroupId } = req.params;
    const { name, allTotalCount, productSettings = [] } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string",
      });
    }

    if (!allTotalCount || typeof allTotalCount !== 'number') {
      return res.status(400).json({
        success: false,
        message: "allTotalCount is required and must be a number",
      });
    }

    // Verify product group exists
    const productGroup = await prisma.productGroup.findUnique({
      where: { id: productGroupId }
    });
    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    // Create product
    const createdProduct = await prisma.product.create({
      data: {
        name,
        allTotalCount,
        productGroupId,
        productSetting: {
          create: productSettings.map((setting: ProductSettingRequest) => ({
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
          })),
        },
      },
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
            productPack: {
              include: {
                Invoice: true,
                Product: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: createdProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update a product (name and allTotalCount only, not productSettings)
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, allTotalCount } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string",
      });
    }

    if (!allTotalCount || typeof allTotalCount !== 'number') {
      return res.status(400).json({
        success: false,
        message: "allTotalCount is required and must be a number",
      });
    }

    // Verify product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name, allTotalCount },
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
            productPack: {
              include: {
                Invoice: true,
                Product: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all products (without grouping)
export const getAllProductsFlat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const products = await prisma.product.findMany({
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
    });

    return res.status(200).json({
      success: true,
      data: products,
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

// Get products by product group ID
export const getProductsByGroupId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { productGroupId } = req.params;

    const products = await prisma.product.findMany({
      where: { productGroupId },
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
            productPack: {
              include: {
                Invoice: true,
                Product: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products by group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
