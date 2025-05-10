import { createProductPack } from "../controller/ProductPack/product_pack.create.controller";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/",
  //   authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createProductPack(req, res).catch(next);
  }
);

export default router;
