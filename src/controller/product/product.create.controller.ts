import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Interfaces
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
  files?: FileRequest[];
}

interface ProductRequest {
  name: string;
  allTotalCount: number;
  productSettings: ProductSettingRequest[];
}

interface ProductGroupRequest {
  name: string;
  files?: FileRequest[];
  products: ProductRequest[];
}

interface ProductsArrayRequest {
  productGroups: ProductGroupRequest[];
}

// **Create multiple ProductGroups**
export const createProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { productGroups }: ProductsArrayRequest = req.body;

    if (!productGroups || !Array.isArray(productGroups)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: productGroups array is required",
      });
    }

    const createdProductGroups = [];
    for (const productGroupData of productGroups) {
      // Check if all files exist
      if (productGroupData.files) {
        for (const file of productGroupData.files) {
          const fileExists = await prisma.file.findUnique({
            where: { id: file.id },
          });
          if (!fileExists) {
            throw new Error(`File with ID ${file.id} does not exist`);
          }
        }
      }

      // Check if all colors and sizes exist
      for (const product of productGroupData.products) {
        for (const setting of product.productSettings) {
          for (const group of setting.sizeGroups) {
            for (const colorSize of group.colorSizes) {
              const colorExists = await prisma.color.findUnique({
                where: { id: colorSize.colorId },
              });
              const sizeExists = await prisma.size.findUnique({
                where: { id: colorSize.sizeId },
              });
              if (!colorExists) {
                throw new Error(`Color with ID ${colorSize.colorId} does not exist`);
              }
              if (!sizeExists) {
                throw new Error(`Size with ID ${colorSize.sizeId} does not exist`);
              }
            }
          }
        }
      }

      const productGroup = await prisma.productGroup.create({
        data: {
          name: productGroupData.name,
          ...(productGroupData.files &&
            productGroupData.files.length > 0 && {
              productGroupFiles: {
                create: productGroupData.files.map((file: FileRequest) => ({
                  file: { connect: { id: file.id } },
                })),
              },
            }),
          products: {
            create: productGroupData.products.map((product: ProductRequest) => ({
              name: product.name,
              allTotalCount: product.allTotalCount,
              productSetting: {
                create: product.productSettings.map((setting) => ({
                  totalCount: setting.totalCount,
                  ...(setting.files &&
                    setting.files.length > 0 && {
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
            })),
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
      createdProductGroups.push(productGroup);
    }

    return res.status(201).json({
      success: true,
      data: createdProductGroups,
    });
  } catch (error) {
    console.error("Error creating product groups:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product groups",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// **Get all ProductGroups with related data**
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

// **Get a single Product by ID**
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

// **Get a single ProductGroup by ID**
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

// **Update Product Settings**
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

    await prisma.productSetting.deleteMany({
      where: { productId: id },
    });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        productSetting: {
          create: productSettings.map((setting) => ({
            totalCount: setting.totalCount,
            ...(setting.files &&
              setting.files.length > 0 && {
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

// **Delete a Product**
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

// **Delete a ProductGroup**
export const deleteProductGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const productGroup = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        Invoice: true,
        products: {
          include: {
            productSetting: {
              include: {
                productSettingFiles: true,
              },
            },
          },
        },
        productGroupFiles: true,
      },
    });

    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    if (productGroup.Invoice && productGroup.Invoice.length > 0) {
      if (force !== "true") {
        return res.status(400).json({
          success: false,
          message:
            "Mahsulotlar guruhini oʻchirib boʻlmaydi, chunki unga boʻlimlar qoʻshilgan",
          data: {
            invoiceCount: productGroup.Invoice.length,
            invoiceIds: productGroup.Invoice.map((invoice) => invoice.id),
            suggestion: "Add ?force=true to delete all related data",
          },
        });
      }

      await prisma.$transaction(async (tx) => {
        const invoiceIds = productGroup.Invoice.map((invoice) => invoice.id);
        await tx.productProtsess.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
        await tx.invoice.deleteMany({
          where: { productGroupId: id },
        });

        const productSettingIds = productGroup.products
          .flatMap((product) => product.productSetting)
          .map((setting) => setting.id);

        if (productSettingIds.length > 0) {
          await tx.productSettingFile.deleteMany({
            where: { productSettingId: { in: productSettingIds } },
          });
        }

        await tx.productGroupFile.deleteMany({
          where: { productGroupId: id },
        });

        for (const product of productGroup.products) {
          for (const setting of product.productSetting) {
            await tx.productColorSize.deleteMany({
              where: {
                sizeGroup: {
                  productSettingId: setting.id,
                },
              },
            });
          }
        }

        await tx.productGroup.delete({
          where: { id },
        });
      });

      return res.status(200).json({
        success: true,
        message: `Product group and all related data deleted successfully`,
        data: {
          deletedInvoices: productGroup.Invoice.length,
          deletedProducts: productGroup.products.length,
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      const productSettingIds = productGroup.products
        .flatMap((product) => product.productSetting)
        .map((setting) => setting.id);

      if (productSettingIds.length > 0) {
        await tx.productSettingFile.deleteMany({
          where: { productSettingId: { in: productSettingIds } },
        });
      }

      await tx.productGroupFile.deleteMany({
        where: { productGroupId: id },
      });

      for (const product of productGroup.products) {
        for (const setting of product.productSetting) {
          await tx.productColorSize.deleteMany({
            where: {
              sizeGroup: {
                productSettingId: setting.id,
              },
            },
          });
        }
      }

      await tx.productGroup.delete({
        where: { id },
      });
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

// **Soft Delete ProductGroup (not implemented)**
export const softDeleteProductGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const productGroup = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        Invoice: true,
      },
    });

    if (!productGroup) {
      return res.status(404).json({
        success: false,
        message: "Product group not found",
      });
    }

    return res.status(501).json({
      success: false,
      message:
        "Soft delete not implemented. Please add 'deletedAt' or 'isActive' field to ProductGroup model",
    });
  } catch (error) {
    console.error("Error soft deleting product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to soft delete product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// **Update a ProductGroup**
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

// **Create a Product**
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

    // Check if all files in productSettings exist
    for (const setting of productSettings) {
      if (setting.files) {
        for (const file of setting.files) {
          const fileExists = await prisma.file.findUnique({
            where: { id: file.id },
          });
          if (!fileExists) {
            throw new Error(`File with ID ${file.id} does not exist`);
          }
        }
      }
    }

    const createdProduct = await prisma.product.create({
      data: {
        name,
        allTotalCount,
        productGroupId,
        productSetting: {
          create: productSettings.map((setting: ProductSettingRequest) => ({
            totalCount: setting.totalCount,
            ...(setting.files &&
              setting.files.length > 0 && {
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

// **Update a Product**
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

// **Get all Products (flat list)**
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

// **Get Products by ProductGroup ID**
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
