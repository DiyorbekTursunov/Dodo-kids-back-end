import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  // Product Group operations
  createProducts,
  getAllProducts,
  getProductGroupById,
  updateProductGroup,
  deleteProductGroup,

  // Individual Product operations
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProductsFlat,
  getProductsByGroupId,

  // Product Settings operations
  updateProductSettings,

  // Product Pack operations
  deleteProductPack,
} from "../controller/product/product.create.controller";

const router = Router();

// ============ PRODUCT GROUP ROUTES ============

// CREATE - Create product groups with products
router.post(
  "/groups",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createProducts(req, res).catch(next);
  }
);

// READ - Get all product groups with their products
router.get("/groups", (req: Request, res: Response, next: NextFunction) => {
  getAllProducts(req, res).catch(next);
});

// READ - Get specific product group by ID
router.get("/groups/:id", (req: Request, res: Response, next: NextFunction) => {
  getProductGroupById(req, res).catch(next);
});

// UPDATE - Update product group name
router.patch(
  "/groups/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    updateProductGroup(req, res).catch(next);
  }
);

// DELETE - Delete product group
router.delete(
  "/groups/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    deleteProductGroup(req, res).catch(next);
  }
);

// ============ INDIVIDUAL PRODUCT ROUTES ============

// CREATE - Create a single product within a product group
router.post(
  "/groups/:productGroupId/products",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createProduct(req, res).catch(next);
  }
);

// READ - Get all products (flat structure, not grouped)
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getAllProductsFlat(req, res).catch(next);
});

// READ - Get products by product group ID
router.get(
  "/groups/:productGroupId/products",
  (req: Request, res: Response, next: NextFunction) => {
    getProductsByGroupId(req, res).catch(next);
  }
);

// READ - Get specific product by ID
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getProductById(req, res).catch(next);
});

// UPDATE - Update product (name and allTotalCount)
router.patch(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    updateProduct(req, res).catch(next);
  }
);

// UPDATE - Update product settings (replace all settings for a product)
router.patch(
  "/:id/settings",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    updateProductSettings(req, res).catch(next);
  }
);

// DELETE - Delete product
router.delete(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    deleteProduct(req, res).catch(next);
  }
);

// ============ PRODUCT PACK ROUTES ============

// DELETE - Delete product pack
router.delete(
  "/packs/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    deleteProductPack(req, res).catch(next);
  }
);

export default router;
