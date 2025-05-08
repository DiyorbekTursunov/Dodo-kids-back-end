import { addProductForWarehouseHandler } from "../controller/mainLine/createProductForWarehouse";
import { authenticate } from "../middleware/authMiddleware";
import express, { Request, Response, NextFunction } from "express";
import { acceptanceProduct } from "../controller/mainLine/acceptanceProduct";

const router = express.Router();

router.post(
  "/acceptance",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    acceptanceProduct(req, res).catch(next);
  }
);

// create mainLineProgress
router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    addProductForWarehouseHandler(req, res).catch(next);
  }
);

export default router;
