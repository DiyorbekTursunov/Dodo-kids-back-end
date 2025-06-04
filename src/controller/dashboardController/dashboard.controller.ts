import { Request, Response } from "express";
import {
  getDashboardStatsByDateRangeService,
  getProductPackStatsService,
  getEmployeeStatsService,
  getAllModelCountsService,
} from "../../service/dashboard/dashboard.service";

export const getDashboardStatsByDateRange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate && !endDate) {
      res.status(400).json({
        success: false,
        message: "At least one of startDate or endDate must be provided",
      });
      return;
    }

    const dashboardData = await getDashboardStatsByDateRangeService(
      startDate as string,
      endDate as string
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats with date range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProductPackStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stats = await getProductPackStatsService(id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching product pack stats:", error);
    res.status(error instanceof Error && error.message === "Invoice not found" ? 404 : 500).json({
      success: false,
      message: "Failed to fetch product pack statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getEmployeeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const stats = await getEmployeeStatsService(employeeId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    res.status(error instanceof Error && error.message === "Employee not found" ? 404 : 500).json({
      success: false,
      message: "Failed to fetch employee statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllModelCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const counts = await getAllModelCountsService();

    res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("Error fetching model counts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch model counts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
