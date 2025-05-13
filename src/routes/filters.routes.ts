import express, { Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { getColors } from "../controller/filter/filter.controller";
import { getSizes } from "../controller/filter/filter.controller";
import { getDepartments } from "../controller/filter/filter.controller";

const router = express.Router();

// Color routes
router.get("/colors", (req: Request, res: Response, next: NextFunction) => {
  getColors(req, res).catch(next);
});

// Size routes
router.get("/sizes", (req: Request, res: Response, next: NextFunction) => {
  getSizes(req, res).catch(next);
});

// Department routes
router.get("/departments", (req: Request, res: Response, next: NextFunction) => {
  getDepartments(req, res).catch(next);
});

export default router;
