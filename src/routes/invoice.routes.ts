import express, { Request, Response, NextFunction, Router } from "express";
import { createBichuvController } from "../controller/productPack/wareHouse/product_pack.add_warehouse.controller";
import { sendProduct } from "../controller/productPack/sendToDepartment/product_pack.send.controller";
import { getAllProductPacks } from "../controller/productPack/wareHouse/product_pack.get_all_warehouse.controller";
import { getSentProductPacks } from "../controller/productPack/sendToDepartment/product_pack.get_all_send_by_db_id.controller";
import { acceptProductPack } from "../controller/productPack/acceptanceToDepartment/product_pack.acceptance.controller";
import { getAcceptedProductPacks } from "../controller/productPack/acceptanceToDepartment/product_pack.get_all_by_dp_id.controller";
import { getPendingProductPacks } from "../controller/productPack/get/getPanding.controller";

const router = Router();

// Create a new invoice in the Bichuv department
router.post(
  "/add-warehouse",
  (req: Request, res: Response, next: NextFunction) => {
    createBichuvController(req, res).catch(next);
  }
);

// Get all product packs for warehouse
router.get(
  "/get-all-warehouse",
  (req: Request, res: Response, next: NextFunction) => {
    getAllProductPacks(req, res).catch(next);
  }
);

// Send products from one department to another
router.post(
  "/send-to-department",
  (req: Request, res: Response, next: NextFunction) => {
    sendProduct(req, res).catch(next);
  }
);

// Get sent product packs by department
router.get(
  "/send-to-department",
  (req: Request, res: Response, next: NextFunction) => {
    getSentProductPacks(req, res).catch(next);
  }
);

// Accept product pack
router.post(
  "/acceptance-to-department",
  (req: Request, res: Response, next: NextFunction) => {
    acceptProductPack(req, res).catch(next);
  }
);

// Get accepted product packs by department
router.get(
  "/acceptance-to-department",
  (req: Request, res: Response, next: NextFunction) => {
    getAcceptedProductPacks(req, res).catch(next);
  }
);

// Get pending product packs by department
router.get(
  "/panding-to-department",
  (req: Request, res: Response, next: NextFunction) => {
    getPendingProductPacks(req, res).catch(next);
  }
);

export default router;
