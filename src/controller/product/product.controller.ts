import { Request, Response } from "express";
import {
  createProductGroup,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../../service/product/product.service";
import { z } from "zod";
import { ProductProtsessStatus, Prisma } from "@prisma/client";

// Zod schemas
const colorSizeSchema = z.object({
  colorId: z.string(),
  quantity: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus).optional(), // Optional status
});

const sizeGroupSchema = z.object({
  sizeId: z.string(),
  quantity: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus).optional(), // Optional status
  colorSizes: z.array(colorSizeSchema),
});

const productSettingSchema = z.object({
  totalCount: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus).optional(), // Optional status
  sizeGroups: z.array(sizeGroupSchema),
});

const productSchema = z.object({
  name: z.string().min(1),
  allTotalCount: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus).optional(), // Optional status
  productSettings: z.array(productSettingSchema),
});

const fileSchema = z.object({
  id: z.string(),
});

const createProductGroupSchema = z.object({
  name: z.string().min(1),
  status: z.nativeEnum(ProductProtsessStatus).optional(), // Optional status
  isSended: z.boolean().optional(), // Optional isSended
  files: z.array(fileSchema),
  products: z.array(productSchema),
});

// Schema for updating a product (unchanged)
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  allTotalCount: z.number().int().min(0).optional(),
});

// Handler to create a ProductGroup
export async function createProductGroupHandler(req: Request, res: Response) {
  try {
    const data = createProductGroupSchema.parse(req.body);
    const productGroup = await createProductGroup(data);
    res.status(201).json(productGroup);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors });
    } else {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

// Handler to create a product (unchanged)
// export async function createProductHandler(req: Request, res: Response) {
//   try {
//     const data = createProductSchema.parse(req.body);
//     const product = await createProduct(data);
//     res.status(201).json(product);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       res.status(400).json({ message: error.errors });
//     } else {
//       res.status(400).json({ message: (error as Error).message });
//     }
//   }
// }

// Handler to get a single product by ID
export async function getProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.json(product);
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}

// Handler to get all products
export async function getProductsHandler(req: Request, res: Response) {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}

// Handler to update a product
export async function updateProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);
    const product = await updateProduct(id, data);
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors });
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

// Handler to delete a product
export async function deleteProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
