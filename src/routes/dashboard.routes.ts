import express from "express";
import {
  getDashboardStatsByDateRange,
  getProductPackStats,
  getEmployeeStats,
  getAllModelCounts,
} from "../controller/dashboardController/dashboard.controller";

const router = express.Router();

// Get dashboard stats by date range
router.get("/dashboard", getDashboardStatsByDateRange);

// Get stats for a specific invoice (product pack)
router.get("/product-pack/:id", getProductPackStats);

// Get stats for a specific employee
router.get("/employee/:employeeId", getEmployeeStats);

// Get counts for all models
router.get("/model-counts", getAllModelCounts);

export default router;
