import { addProductForWarehouseHandler } from "../controller/mainLine/createProductForWarehouse";
import { authenticate } from "../middleware/authMiddleware";
import express, { Request, Response, NextFunction } from "express";
import { acceptanceProduct } from "../controller/mainLine/acceptanceProduct";
import { completeProductTransferHandler } from "../controller/mainLine/sendProduct";
import { getAllProductsController } from "../controller/mainLine/getAllProducts";
import { getLinesByDepartmentController } from "../controller/mainLine/getAllProductDpId";
import { getAcceptedProductsController } from "../controller/mainLine/acceptanceProductByDpId";
import { getCompletedProductsController } from "../controller/mainLine/completeProductByDpId";

const router = express.Router();

router.get(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getAllProductsController(req, res).catch(next);
  }
);

router.get(
  "/:departmentId",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getLinesByDepartmentController(req, res).catch(next);
  }
);

router.post(
  "/acceptance",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    acceptanceProduct(req, res).catch(next);
  }
);

router.get(
  "/acceptance/:departmentId",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getAcceptedProductsController(req, res).catch(next);
  }
);

router.post(
  "/complete",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    completeProductTransferHandler(req, res).catch(next);
  }
);

router.get(
  "/complete/:departmentId",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getCompletedProductsController(req, res).catch(next);
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
