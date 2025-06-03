// src/controllers/product.controller.ts
import { Request, Response } from "express";
import {
  createProduct as createProductService,
  getProductById as getProductByIdService,
  updateProduct,
  deleteProduct,
  getAllProductsFlat,
  getProductsByGroupId,
  updateProductSettings,
} from "../../service/product/product.service";
import {
  createProductGroups,
  getAllProductGroups,
  getProductGroupById as getProductGroupByIdService,
  updateProductGroup,
  deleteProductGroup,
} from "../../service/product/productGroup.service";
import {
  ProductsArrayRequest,
  ProductRequest,
  ProductSettingRequest,
} from "../../types/product/product.interface";

// Create multiple product groups
export const handleCreateProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productGroups }: ProductsArrayRequest = req.body;
    if (!productGroups?.length) {
      return res.status(400).json({ success: false, message: "productGroups array is required" });
    }

    const createdProductGroups = await createProductGroups({ productGroups });
    return res.status(201).json({ success: true, data: createdProductGroups });
  } catch (error) {
    console.error("Error creating product groups:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product groups",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all product groups
export const handleGetAllProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productGroups = await getAllProductGroups();
    return res.status(200).json({ success: true, data: productGroups });
  } catch (error) {
    console.error("Error fetching product groups:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product groups",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a single product by ID
export const handleGetProductById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const product = await getProductByIdService(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get a single product group by ID
export const handleGetProductGroupById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const productGroup = await getProductGroupByIdService(id);
    if (!productGroup) {
      return res.status(404).json({ success: false, message: "Product group not found" });
    }
    return res.status(200).json({ success: true, data: productGroup });
  } catch (error) {
    console.error("Error fetching product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update product settings
export const handleUpdateProductSettings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { productSettings }: { productSettings: ProductSettingRequest[] } = req.body;
    if (!productSettings?.length) {
      return res.status(400).json({ success: false, message: "productSettings array is required" });
    }

    const updatedProduct = await updateProductSettings(id, productSettings);
    return res.status(200).json({ success: true, data: updatedProduct });
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
export const handleDeleteProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    await deleteProduct(id);
    return res.status(200).json({ success: true, message: "Product deleted successfully" });
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
export const handleDeleteProductGroup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const force = req.query.force === "true";
    await deleteProductGroup(id, force);
    return res.status(200).json({ success: true, message: "Product group deleted successfully" });
  } catch (error) {
    console.error("Error deleting product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update a product group
export const handleUpdateProductGroup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Name is required and must be a string" });
    }

    const updatedGroup = await updateProductGroup(id, { name });
    return res.status(200).json({ success: true, data: updatedGroup });
  } catch (error) {
    console.error("Error updating product group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create a single product
export const handleCreateProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productGroupId } = req.params;
    const { name, allTotalCount, productSettings }: ProductRequest = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Name is required and must be a string" });
    }
    if (!allTotalCount || typeof allTotalCount !== "number" || allTotalCount < 0) {
      return res.status(400).json({ success: false, message: "allTotalCount is required and must be a non-negative number" });
    }

    const createdProduct = await createProductService(productGroupId, { name, allTotalCount, productSettings });
    return res.status(201).json({ success: true, data: createdProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update a product
export const handleUpdateProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, allTotalCount }: Partial<ProductRequest> = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Name is required and must be a string" });
    }
    if (!allTotalCount || typeof allTotalCount !== "number" || allTotalCount < 0) {
      return res.status(400).json({ success: false, message: "allTotalCount is required and must be a non-negative number" });
    }

    const updatedProduct = await updateProduct(id, { name, allTotalCount });
    return res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all products (flat list)
export const handleGetAllProductsFlat = async (req: Request, res: Response): Promise<Response> => {
  try {
    const products = await getAllProductsFlat();
    return res.status(200).json({ success: true, data: products });
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
export const handleGetProductsByGroupId = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productGroupId } = req.params;
    const products = await getProductsByGroupId(productGroupId);
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products by group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
