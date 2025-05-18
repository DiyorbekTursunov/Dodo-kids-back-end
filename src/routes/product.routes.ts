// import { getAllProducts } from "../controller/product/product.get_all.controller";
import { createProduct, getAllProducts } from "../controller/product/product.create.controller";
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createProduct(req, res).catch(next);
  }
);

router.get(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getAllProducts(req, res).catch(next);
  }
);

export default router;
