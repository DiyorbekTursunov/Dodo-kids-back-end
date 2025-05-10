import { createProductProtsess } from "../controller/productProtsess/product_protsess.controller";
import { createProductPack } from "../controller/productPack/product_pack.create.controller";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  createProductProtsess(req, res).catch(next);
});

export default router;
