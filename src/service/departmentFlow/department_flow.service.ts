import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

const normalizeDepartment = (name: string): string => {
  const map: Record<string, string> = {
    autdorspechat: "pechat",
    autsorstikuv: "tikuv",
  };
  return map[name.toLowerCase()] || name.toLowerCase();
};

export const getNextDepartmentsService = async (departmentId: string) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  const currentDeptName = department.name;
  const normalizedName = normalizeDepartment(currentDeptName);
  const nextNames = departmentFlowMap[normalizedName] || [];

  const resolvedDepartments = await prisma.department.findMany({
    where: {
      name: {
        in: nextNames,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return {
    currentDepartment: department.name,
    nextDepartments: resolvedDepartments,
  };
};
