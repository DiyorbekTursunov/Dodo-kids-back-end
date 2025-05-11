import express, { Request, Response, NextFunction } from "express";
import { addWareHouse } from "../controller/productPack/wareHouse/product_pack.add_warehouse.controller";
import { getAllProductPacks } from "../controller/productPack/wareHouse/product_pack.get_all_warehouse.controller";
import { authenticate } from "../middleware/authMiddleware";
import { sendToDepartment } from "../controller/productPack/sendToDepartment/product_pack.send.controller";
import { acceptProductPack } from "../controller/productPack/acceptanceToDepartment/product_pack.acceptance.controller";

const router = express.Router();

router.post(
  "/add-warehouse",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    addWareHouse(req, res).catch(next);
  }
);

router.get(
  "/get-all-warehouse",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getAllProductPacks(req, res).catch(next);
  }
);

router.post(
  "/send-to-department",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    sendToDepartment(req, res).catch(next);
  }
);

router.post(
  "/acceptance-to-department",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    acceptProductPack(req, res).catch(next);
  }
);

export default router;
