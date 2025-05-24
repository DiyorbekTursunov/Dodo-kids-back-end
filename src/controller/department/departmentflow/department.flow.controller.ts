import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Updated department flow map to match database names
const departmentFlowMap: Record<string, string[]> = {
  ombor: ["bichuv"],
  bichuv: ["tasnif"],
  tasnif: ["pechat", "autsorsPechat", "tikuv", "autsorsTikuv"],
  pechat: ["tasnif"],
  autsorsPechat: ["tasnif"],
  tikuv: ["chiska"],
  autsorsTikuv: ["chiska"],
  chiska: ["kontrol"],
  kontrol: ["dazmol"],
  dazmol: ["upakofka"],
  upakofka: ["ombor"],
};

// Normalize outsourced versions to their group name
const normalizeDepartment = (name: string): string => {
  const map: Record<string, string> = {
    autdorspechat: "pechat",
    autsorstikuv: "tikuv",
  };
  return map[name.toLowerCase()] || name.toLowerCase();
};

export const getNextDepartments = async (req: Request, res: Response) => {
  const { departmentId } = req.params;

  try {
    // Fetch the current department
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const currentDeptName = department.name;
    const normalizedName = normalizeDepartment(currentDeptName);

    // Get next department names from the flow map
    const nextNames = departmentFlowMap[normalizedName] || [];
    console.log("Current department:", currentDeptName);
    console.log("Next department names:", nextNames);

    if (nextNames.length === 0) {
      return res.status(200).json({
        success: true,
        currentDepartment: department.name,
        nextDepartments: [],
      });
    }

    // Fetch all next departments from the database
    const resolvedDepartments = await prisma.department.findMany({
      where: {
        name: {
          in: nextNames,
          mode: "insensitive", // Still useful for minor case variations
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log("Resolved departments:", resolvedDepartments);

    if (resolvedDepartments.length === 0 && nextNames.length > 0) {
      console.warn(`No departments found for names: ${nextNames.join(", ")}`);
    }

    return res.status(200).json({
      success: true,
      currentDepartment: department.name,
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
