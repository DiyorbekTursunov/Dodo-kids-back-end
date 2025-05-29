import { getDashboardStatsByDateRange } from "@/controller/dashboardController/dashboard.all_stats_date.controller";
import express from "express";


const router = express.Router();

router.get("/dashboard", getDashboardStatsByDateRange);

export default router;
