import express, { Request, Response, NextFunction } from "express";
import { addInvoice } from "../controller/productPack/wareHouse/product_pack.add_warehouse.controller";
import { getAllProductPacks } from "../controller/productPack/wareHouse/product_pack.get_all_warehouse.controller";
import { authenticate } from "../middleware/authMiddleware";
import { sendToDepartment } from "../controller/productPack/sendToDepartment/product_pack.send.controller";
import { acceptProductPack } from "../controller/productPack/acceptanceToDepartment/product_pack.acceptance.controller";
import { getSentProductPacks } from "../controller/productPack/sendToDepartment/product_pack.get_all_send_by_db_id.controller";
import { getAcceptanceProductPacks } from "../controller/productPack/acceptanceToDepartment/product_pack.get_all_by_dp_id.controller";
import { getPendingProductPacks } from "../controller/productPack/get/getPanding.controller";
import { getProductPackById } from "../controller/productPack/get/getDetailPage.controller";
import { getConsolidatedCaseTrackerStatus } from "../controller/productPack/get/getMapPage.controller";
import { forceDeleteAllHandler } from "../controller/del/del";

const router = express.Router();

router.delete(
  "/del",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    forceDeleteAllHandler(req, res).catch(next);
  }
);

router.get(
  "/details/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getProductPackById(req, res).catch(next);
  }
);

router.get(
  "/status-map",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getConsolidatedCaseTrackerStatus(req, res).catch(next);
  }
);

router.post(
  "/add-warehouse",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    addInvoice(req, res).catch(next);
  }
);

router.get(
  "/get-all-warehouse",
//   authenticate,
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

router.get(
  "/send-to-department",
//   authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getSentProductPacks(req, res).catch(next);
  }
);

router.post(
  "/acceptance-to-department",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    acceptProductPack(req, res).catch(next);
  }
);

router.get(
  "/acceptance-to-department",
//   authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getAcceptanceProductPacks(req, res).catch(next);
  }
);

router.get(
  "/panding-to-department",
//   authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getPendingProductPacks(req, res).catch(next);
  }
);

export default router;
