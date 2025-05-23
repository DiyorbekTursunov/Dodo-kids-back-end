import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  createProducts,
  getAllProducts,
  getProductById,
  updateProductSettings,
  deleteProduct,
  deleteProductPack,
} from "../controller/product/product.create.controller";

const router = Router();

// CREATE
router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createProducts(req, res).catch(next);
  }
);

// READ
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getAllProducts(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getProductById(req, res).catch(next);
});

router.patch(
  "/:id/settings",
  (req: Request, res: Response, next: NextFunction) => {
    updateProductSettings(req, res).catch(next);
  }
);

// DELETE
router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  deleteProduct(req, res).catch(next);
});

router.delete(
  "/:id/packs/:packId",
  (req: Request, res: Response, next: NextFunction) => {
    deleteProductPack(req, res).catch(next);
  }
);

export default router;
