// src/controllers/department.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

export const departmentFlowMap: Record<string, string[]> = {
  ombor: ["bichuv"],
  bichuv: ["tasnif"],
  tasnif: ["pechat", "AutsorsPechat"],
  pechat: ["tasnif"],
  AutsorsPechat: ["tasnif"],
  tikuv: ["chistka"],
  AutsorsTikuv: ["chistka"],
  chistka: ["Chiska"],
  Chiska: ["kontrol"],
  kontrol: ["Dazmol"],
  Dazmol: ["Upakofka"],
};

const prisma = new PrismaClient();

export const getNextDepartments = async (req: Request, res: Response) => {
  const { departmentId } = req.params;

  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const currentDeptName = department.name;

    const nextDepartments = departmentFlowMap[currentDeptName];

    if (!nextDepartments) {
      return res.status(200).json({
        success: true,
        message: "No next departments defined for this department.",
        data: [],
      });
    }

    const resolvedDepartments = await prisma.department.findMany({
      where: {
        name: {
          in: nextDepartments,
        },
      },
    });

    return res.status(200).json({
      success: true,
      currentDepartment: currentDeptName,
      nextDepartments: resolvedDepartments,
    });
  } catch (error) {
    console.error("Error fetching next departments:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
