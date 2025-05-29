import { getDashboardStatsByDateRangeService } from "@/service/dashboard/dashboard.service";
import { Request, Response } from "express";


export const getDashboardStatsByDateRange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const startDateInput = req.query.startDate as string;
    const endDateInput = req.query.endDate as string;

    const dashboardData = await getDashboardStatsByDateRangeService(
      startDateInput,
      endDateInput
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats with date range:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
