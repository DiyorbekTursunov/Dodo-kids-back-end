import { createProduct } from "../controller/product/product.create.controller";
import { Router, Request, Response, NextFunction } from "express";

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  createProduct(req, res).catch(next);
});

export default router;
