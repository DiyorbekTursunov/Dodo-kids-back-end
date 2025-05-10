import { createColor } from "../controller/color/color.create.controller";
import { deleteColor } from "../controller/color/color.delete.controller";
import { getColors } from "../controller/color/color.get_all.controller";
import { getColorById } from "../controller/color/color.get_id.controller";
import { updateColor } from "../controller/color/color.update.controller";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  createColor(req, res).catch(next);
});

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getColors(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getColorById(req, res).catch(next);
});

router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  updateColor(req, res).catch(next);
});

router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  deleteColor(req, res).catch(next);
});

export default router;
