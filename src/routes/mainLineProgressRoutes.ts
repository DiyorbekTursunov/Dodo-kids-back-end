import { getAllMainLineProgressHandler } from "../controller/mainLine/getAll";
import { addProductForWarehouseHandler } from "../controller/mainLine/createProductForWarehouse";
import { authenticate } from "../middleware/authMiddleware";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getAllMainLineProgressHandler(req, res).catch(next);
});

// create mainLineProgress
router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    addProductForWarehouseHandler(req, res).catch(next);
  }
);



export default router;
