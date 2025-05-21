// import { getAllProducts } from "../controller/product/product.get_all.controller";

import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { createProducts } from "../controller/product/product.create.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createProducts(req, res).catch(next);
  }
);

// router.get(
//   "/",
//   authenticate,
//   (req: Request, res: Response, next: NextFunction) => {
//     getAllProducts(req, res).catch(next);
//   }
// );

export default router;
