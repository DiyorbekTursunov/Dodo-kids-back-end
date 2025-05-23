import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface FileRequest {
  id: string;
  fileName?: string;
  path?: string;
  mimeType?: string;
  size?: number;
  fileType?: string;
  createdAt?: string;
  updatedAt?: string;
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
  sizeGroups: SizeGroupRequest[];
  productPackId?: string;
  files?: FileRequest[]; // Now supported with updated schema
}

interface ProductRequest {
  name: string;
  allTotalCount: number;
  productSettings: ProductSettingRequest[];
}

interface ProductGroupRequest {
  name: string;
  files?: FileRequest[]; // Optional files at group level
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
    const { products }: ProductsArrayRequest = req.body;

    const productGroups = [];
    for (const productGroupData of products) {
      const productGroup = await prisma.productGroup.create({
        data: {
          name: productGroupData.name,
          // Handle files at ProductGroup level if they exist
          ...(productGroupData.files && productGroupData.files.length > 0 && {
            productGroupFiles: {
              create: productGroupData.files.map((file: FileRequest) => ({
                file: { connect: { id: file.id } },
              })),
            },
          }),
          products: {
            create: productGroupData.products.map(
              (productData: ProductRequest) => ({
                name: productData.name,
                allTotalCount: productData.allTotalCount,
                productSetting: {
                  create: productData.productSettings.map(
                    (setting: ProductSettingRequest) => ({
                      totalCount: setting.totalCount,
                      // Handle files at ProductSetting level if they exist
                      ...(setting.files && setting.files.length > 0 && {
                        productSettingFiles: {
                          create: setting.files.map((file: FileRequest) => ({
                            file: { connect: { id: file.id } },
                          })),
                        },
                      }),
                      sizeGroups: {
                        create: setting.sizeGroups.map(
                          (group: SizeGroupRequest) => ({
                            size: group.size,
                            quantity: group.quantity,
                            colorSizes: {
                              create: group.colorSizes.map(
                                (colorSize: ColorSizeRequest) => ({
                                  quantity: colorSize.quantity,
                                  color: { connect: { id: colorSize.colorId } },
                                  size: { connect: { id: colorSize.sizeId } },
                                })
                              ),
                            },
                          })
                        ),
                      },
                    })
                  ),
                },
              })
            ),
          },
        },
        include: {
          productGroupFiles: {
            include: {
              file: true,
            },
          },
          products: {
            include: {
              productSetting: {
                include: {
                  productSettingFiles: {
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
                },
              },
            },
          },
        },
      });
      productGroups.push(productGroup);
    }

    return res.status(201).json({
      success: true,
      data: productGroups,
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

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const productGroups = await prisma.productGroup.findMany({
      include: {
        productGroupFiles: {
          include: {
            file: true,
          },
        },
        products: {
          include: {
            productSetting: {
              include: {
                productSettingFiles: {
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

export const getProductById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
          },
        },
        productSetting: {
          include: {
            productSettingFiles: {
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
          },
        },
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

export const getProductGroupById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const productGroup = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        productGroupFiles: {
          include: {
            file: true,
          },
        },
        products: {
          include: {
            productSetting: {
              include: {
                productSettingFiles: {
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

export const updateProductSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { productSettings }: { productSettings: ProductSettingRequest[] } =
      req.body;

    if (!productSettings || !Array.isArray(productSettings)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: productSettings array is required",
      });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete existing product settings
    await prisma.productSetting.deleteMany({
      where: { productId: id },
    });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        productSetting: {
          create: productSettings.map((setting) => ({
            totalCount: setting.totalCount,
            ...(setting.files && setting.files.length > 0 && {
              productSettingFiles: {
                create: setting.files.map((file: FileRequest) => ({
                  file: { connect: { id: file.id } },
                })),
              },
            }),
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
            productSettingFiles: {
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

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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

export const deleteProductGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const productGroup = await prisma.productGroup.findUnique({
      where: { id },
    });
    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

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

export const updateProductGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string",
      });
    }

    const existingGroup = await prisma.productGroup.findUnique({
      where: { id },
    });
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    const updatedGroup = await prisma.productGroup.update({
      where: { id },
      data: { name },
      include: {
        productGroupFiles: {
          include: {
            file: true,
          },
        },
        products: {
          include: {
            productSetting: {
              include: {
                productSettingFiles: {
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

export const createProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { productGroupId } = req.params;
    const { name, allTotalCount, productSettings = [] } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string",
      });
    }

    if (!allTotalCount || typeof allTotalCount !== "number") {
      return res.status(400).json({
        success: false,
        message: "allTotalCount is required and must be a number",
      });
    }

    const productGroup = await prisma.productGroup.findUnique({
      where: { id: productGroupId },
    });
    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    const createdProduct = await prisma.product.create({
      data: {
        name,
        allTotalCount,
        productGroupId,
        productSetting: {
          create: productSettings.map((setting: ProductSettingRequest) => ({
            totalCount: setting.totalCount,
            ...(setting.files && setting.files.length > 0 && {
              productSettingFiles: {
                create: setting.files.map((file: FileRequest) => ({
                  file: { connect: { id: file.id } },
                })),
              },
            }),
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
        productGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
          },
        },
        productSetting: {
          include: {
            productSettingFiles: {
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

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, allTotalCount } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string",
      });
    }

    if (!allTotalCount || typeof allTotalCount !== "number") {
      return res.status(400).json({
        success: false,
        message: "allTotalCount is required and must be a number",
      });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name, allTotalCount },
      include: {
        productGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
          },
        },
        productSetting: {
          include: {
            productSettingFiles: {
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

export const getAllProductsFlat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const products = await prisma.product.findMany({
      include: {
        productGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
          },
        },
        productSetting: {
          include: {
            productSettingFiles: {
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
          },
        },
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

export const getProductsByGroupId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { productGroupId } = req.params;

    const products = await prisma.product.findMany({
      where: { productGroupId },
      include: {
        productGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
          },
        },
        productSetting: {
          include: {
            productSettingFiles: {
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
