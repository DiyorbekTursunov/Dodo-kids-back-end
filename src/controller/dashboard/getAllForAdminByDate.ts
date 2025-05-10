import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

export const getFullStatsByDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const departments = await prisma.department.findMany();

    const allLines = await prisma.line.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        departmentId: true,
        qoshilganlarSoni: true,
        yuborilganlarSoni: true,
        qoldiqSolni: true,
      },
    });

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

    const departmentStats = departments.map((dept) => {
      const deptLines = allLines.filter(
        (line) => line.departmentId === dept.id
      );

      return {
        id: dept.id,
        nomi: dept.name,
        jamiQabulQilinganlar: deptLines.reduce(
          (sum, line) => sum + (line.qoshilganlarSoni || 0),
          0
        ),
        jamiYuborilganlar: deptLines.reduce(
          (sum, line) =>
            sum + (line.yuborilganlarSoni?.reduce((a, b) => a + b, 0) || 0),
          0
        ),
        jamiQoldiq: deptLines.reduce(
          (sum, line) => sum + (line.qoldiqSolni || 0),
          0
        ),
      };
    });

    return res.status(200).json({
      general: generalStats,
      byDepartment: departmentStats,
    });
  } catch (error) {
    console.error("Get full stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
