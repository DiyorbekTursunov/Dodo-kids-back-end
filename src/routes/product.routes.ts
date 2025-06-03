// src/routes/product.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  handleCreateProducts,
  handleGetAllProducts,
  handleGetProductGroupById,
  handleUpdateProductGroup,
  handleDeleteProductGroup,
  handleCreateProduct,
  handleGetProductById,
  handleUpdateProduct,
  handleDeleteProduct,
  handleGetAllProductsFlat,
  handleGetProductsByGroupId,
  handleUpdateProductSettings,
} from "../controller/product/product.controller";

const router = Router();

// ============ PRODUCT GROUP ROUTES ============

// CREATE - Create product groups with products
router.post(
  "/groups",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleCreateProducts(req, res).catch(next);
  }
);

// READ - Get all product groups with their products
router.get("/groups", (req: Request, res: Response, next: NextFunction) => {
  handleGetAllProducts(req, res).catch(next);
});

// READ - Get specific product group by ID
router.get("/groups/:id", (req: Request, res: Response, next: NextFunction) => {
  handleGetProductGroupById(req, res).catch(next);
});

// UPDATE - Update product group name
router.patch(
  "/groups/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleUpdateProductGroup(req, res).catch(next);
  }
);

// DELETE - Delete product group
router.delete(
  "/groups/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleDeleteProductGroup(req, res).catch(next);
  }
);

// ============ INDIVIDUAL PRODUCT ROUTES ============

// CREATE - Create a single product within a product group
router.post(
  "/groups/:productGroupId/products",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleCreateProduct(req, res).catch(next);
  }
);

// READ - Get all products (flat structure, not grouped)
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  handleGetAllProductsFlat(req, res).catch(next);
});

// READ - Get products by product group ID
router.get(
  "/groups/:productGroupId/products",
  (req: Request, res: Response, next: NextFunction) => {
    handleGetProductsByGroupId(req, res).catch(next);
  }
);

// READ - Get specific product by ID
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  handleGetProductById(req, res).catch(next);
});

// UPDATE - Update product (name and allTotalCount)
router.patch(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleUpdateProduct(req, res).catch(next);
  }
);

// UPDATE - Update product settings (replace all settings for a product)
router.patch(
  "/:id/settings",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleUpdateProductSettings(req, res).catch(next);
  }
);

// DELETE - Delete product
router.delete(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    handleDeleteProduct(req, res).catch(next);
  }
);

export default router;
