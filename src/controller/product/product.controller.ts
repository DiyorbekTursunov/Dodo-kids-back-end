import { Request, Response } from 'express';
import { createProduct, getProductById, getProducts, updateProduct, deleteProduct } from '../../service/product/product.service';
import { z } from 'zod';
import { ProductProtsessStatus } from '@prisma/client';

const colorSizeSchema = z.object({
  colorId: z.string(),
  quantity: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus),
});

const sizeGroupSchema = z.object({
  sizeId: z.string(),
  quantity: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus),
  colorSizes: z.array(colorSizeSchema),
});

const productSettingSchema = z.object({
  totalCount: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus),
  sizeGroups: z.array(sizeGroupSchema),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  allTotalCount: z.number().int().min(0),
  status: z.nativeEnum(ProductProtsessStatus),
  productGroupId: z.string(),
  productSettings: z.array(productSettingSchema),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  allTotalCount: z.number().int().min(0).optional(),
  status: z.nativeEnum(ProductProtsessStatus).optional(),
});

export async function createProductHandler(req: Request, res: Response) {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors });
    } else {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

export async function getProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json(product);
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}

export async function getProductsHandler(req: Request, res: Response) {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);
    const product = await updateProduct(id, data);
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors });
    } else {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
}
