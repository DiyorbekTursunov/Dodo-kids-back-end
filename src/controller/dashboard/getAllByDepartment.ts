// src/controllers/statsController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get full stats
export const getFullStats = async (req: Request, res: Response) => {
  try {
    // Fetch general stats
    const departments = await prisma.department.findMany({
      include: {
        employees: false,  // Exclude employees from the result for now
      },
    });

    const allLines = await prisma.line.findMany({
      select: {
        departmentId: true,
        qoshilganlarSoni: true,
        yuborilganlarSoni: true,
        qoldiqSolni: true,
      },
    });

    // Calculate general stats
    const generalStats = {
      jamiBolimlarSoni: departments.length,
      jamiQabulQilinganlar: allLines.reduce(
        (sum, line) => sum + (line.qoshilganlarSoni || 0),
        0
      ),
      jamiYuborilganlar: allLines.reduce(
        (sum, line) =>
          sum + (line.yuborilganlarSoni?.reduce((a, b) => a + b, 0) || 0),
        0
      ),
      jamiQoldiq: allLines.reduce(
        (sum, line) => sum + (line.qoldiqSolni || 0),
        0
      ),
    };

    // Calculate department-specific stats
    const departmentStats = departments.map((dept) => {
      const deptLines = allLines.filter((line) => line.departmentId === dept.id);

      const jamiQabulQilinganlar = deptLines.reduce(
        (sum, line) => sum + (line.qoshilganlarSoni || 0),
        0
      );

      const jamiYuborilganlar = deptLines.reduce(
        (sum, line) =>
          sum + (line.yuborilganlarSoni?.reduce((a, b) => a + b, 0) || 0),
        0
      );

      return {
        id: dept.id,
        nomi: dept.name,
        jamiQabulQilinganlar,
        jamiYuborilganlar,
        jamiQoldiq: deptLines.reduce(
          (sum, line) => sum + (line.qoldiqSolni || 0),
          0
        ),
      };
    });

    // Return response with the calculated stats
    return res.status(200).json({
      general: generalStats,
      byDepartment: departmentStats,
    });
  } catch (error) {
    console.error("Get full stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
