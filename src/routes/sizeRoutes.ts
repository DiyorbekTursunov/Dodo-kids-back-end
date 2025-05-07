// src/routes/colorRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware";
import { getAllSizes } from "../controller/size/getAllSizes";
import { getSizeById } from "../controller/size/getSizesById";
import { createSize } from "../controller/size/createSizes";
import { updateSize } from "../controller/size/updateSizes";
import { deleteSize } from "../controller/size/deleteSizes";

const router = express.Router();

// Public route - anyone can get all sizes
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getAllSizes(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getSizeById(req, res).catch(next);
});

router.post(
  "/",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    createSize(req, res).catch(next);
  }
);

router.put(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    updateSize(req, res).catch(next);
  }
);

router.delete(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    deleteSize(req, res).catch(next);
  }
);

export default router;
