import { getFullStats } from "../controller/dashboard/getAllByDepartment";
import { getFullStatsByDateHandler } from "../controller/dashboard/getAllForAdminByDate";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.get("/full", async (req: Request, res: Response, next: NextFunction) => {
  try {
    getFullStats(req, res).catch(next);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/full-by-date",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getFullStatsByDateHandler(req, res, next); // Pass req, res, next properly here
    } catch (err) {
      next(err);
    }
  }
);

export default router;
