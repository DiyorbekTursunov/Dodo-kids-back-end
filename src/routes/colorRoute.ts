// src/routes/colorRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware";
import { getAllColors } from "../controller/color/getAllColors";
import { getColorById } from "../controller/color/getColorsById";
import { createColor } from "../controller/color/createColor";
import { updateColor } from "../controller/color/updateColor";
import { deleteColor } from "../controller/color/deleteColor";

const router = express.Router();

// Public route - anyone can get all colors
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getAllColors(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getColorById(req, res).catch(next);
});

// Admin-only routes for managing colors
router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createColor(req, res).catch(next);
  }
);

router.put(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    updateColor(req, res).catch(next);
  }
);

router.delete(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    deleteColor(req, res).catch(next);
  }
);

export default router;
