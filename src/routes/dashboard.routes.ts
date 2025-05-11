
import { getDashboardStats } from "../controller/dashboardController/dashboard.all_stats.controller";
import { getDashboardStatsByDateRange } from "../controller/dashboardController/dashboard.all_stats_date.controller";
import { getProductPackStats } from "../controller/dashboardController/dashboard.product_pack_id.controller";
import { getDepartmentStats } from "../controller/dashboardController/dashboard.stats_dp_id.controller";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.get("/stats", (req: Request, res: Response, next: NextFunction) => {
  getDashboardStats(req, res).catch(next);
});

router.post("/stats-by-date", (req: Request, res: Response, next: NextFunction) => {
    getDashboardStatsByDateRange(req, res).catch(next);
  });


router.get(
  "/stats/:departmentId",
  (req: Request, res: Response, next: NextFunction) => {
    getDepartmentStats(req, res).catch(next);
  }
);

router.get(
  "/productpack/:id",
  (req: Request, res: Response, next: NextFunction) => {
    getProductPackStats(req, res).catch(next);
  }
);

export default router;
