// src/controllers/department.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// All routes, including reverse for pechat -> tasnif
const departmentFlowMap: Record<string, string[]> = {
  ombor: ["bichuv"],
  bichuv: ["tasnif"],
  tasnif: ["pechat", "autsorsPechat", "tikuv", "autsorsTikuv"],
  pechat: ["tasnif"],
  autsorsPechat: ["tasnif"],
  tikuv: ["chistka"],
  autsorsTikuv: ["chistka"],
  chistka: ["chistka kontrol"], // 👈 after chistka comes kontrol
  "chistka kontrol": ["dazmol"],
  dazmol: ["upakofka"],
  upakofka: ["ombor"], // 👈 loop back to start
};

// Normalize outsourced versions to their group name
const normalizeDepartment = (name: string): string => {
  const map: Record<string, string> = {
    autsorsPechat: "pechat",
    autsorsTikuv: "tikuv",
  };
  return map[name] || name;
};

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
    const normalizedName = normalizeDepartment(currentDeptName);

    // Get next department names based on current
    const nextNames = departmentFlowMap[currentDeptName] || [];

    // Fetch next departments from DB
    const resolvedDepartments = await prisma.department.findMany({
      where: {
        name: {
          in: nextNames,
        },
      },
    });

    return res.status(200).json({
      success: true,
      currentDepartment: currentDeptName,
      nextDepartments: resolvedDepartments,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
