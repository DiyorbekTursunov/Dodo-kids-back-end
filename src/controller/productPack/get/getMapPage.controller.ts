import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const departmentOrderMap: Record<string, { logicalId: number; allowedNext: string[] }> = {
  bichuv: { logicalId: 1, allowedNext: ["tasnif"] },
  tasnif: { logicalId: 2, allowedNext: ["pechat", "pechatusluga"] },
  pechat: { logicalId: 3, allowedNext: ["vishivka", "vishivkausluga"] },
  pechatusluga: { logicalId: 3, allowedNext: ["vishivka", "vishivkausluga"] },
  vishivka: { logicalId: 4, allowedNext: ["tikuv", "tikuvusluga"] },
  vishivkausluga: { logicalId: 4, allowedNext: ["tikuv", "tikuvusluga"] },
  tikuv: { logicalId: 5, allowedNext: ["chistka"] },
  tikuvusluga: { logicalId: 5, allowedNext: ["chistka"] },
  chistka: { logicalId: 6, allowedNext: ["kontrol"] },
  kontrol: { logicalId: 7, allowedNext: ["dazmol"] },
  dazmol: { logicalId: 8, allowedNext: ["upakovka"] },
  upakovka: { logicalId: 9, allowedNext: ["ombor"] },
  ombor: { logicalId: 10, allowedNext: [] },
};

const normalizeDepartment = (name: string): string => {
  const map: Record<string, string> = {
    autsorspechat: "pechat",
    autsorstikuv: "tikuv",
    pechatusluga: "pechatusluga",
    vishivkausluga: "vishivkausluga",
    tikuvusluga: "tikuvusluga",
  };
  return map[name.toLowerCase()] || name.toLowerCase();
};

interface RawProductPack {
  id: string;
  department: string;
  protsessIsOver: boolean;
  perentId: string;
  productGroup: {
    id: string;
    name: string;
  };
  totalCount: number;
  status: {
    id: string;
    date: Date;
    protsessIsOver: boolean;
    status: string;
    acceptCount: number;
    sendedCount: number;
    invalidCount: number;
    residueCount: number;
    invalidReason: string;
    isOutsourseCompany: boolean;
    outsourseCompanyId: string | null;
    outsourseName: string | null;
  }[];
}

interface FormattedProductPack {
  id: string;
  department: string;
  logicalId: number;
  protsessIsOver: boolean;
  perentId: string;
  ProductGroup: {
    id: string;
    name: string;
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
  statusDate: string;
  isOutsourseCompany: boolean;
  outsourseCompanyId: string | null;
  outsourseName: string | null;
}

interface ConsolidatedProductPack {
  id: string;
  department: string;
  logicalId: number;
  protsessIsOver: boolean;
  perentId: string;
  ProductGroup: {
    id: string;
    name: string;
  };
  totalCount: number;
  sendedCount: number;
  acceptCount: number;
  residueCount: number;
  isSent: boolean;
  status: string;
  isOutsourseCompany: boolean;
  outsourseCompanyId: string | null;
  outsourseName: string | null;
}

export const getConsolidatedCaseTrackerStatus = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch all invoices with only the latest status record
    const productPacks = await prisma.invoice.findMany({
      select: {
        id: true,
        department: true,
        protsessIsOver: true,
        perentId: true,
        totalCount: true,
        productGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        status: {
          orderBy: {
            date: "desc",
          },
          take: 1,
          select: {
            id: true,
            date: true,
            protsessIsOver: true,
            status: true,
            acceptCount: true,
            sendedCount: true,
            invalidCount: true,
            residueCount: true,
            invalidReason: true,
            isOutsourseCompany: true,
            outsourseCompanyId: true,
            outsourseName: true,
          },
        },
      },
    });

    // Format packs using the latest status
    const formattedPacks: FormattedProductPack[] = productPacks.map((pack) => {
      const latestProcess = pack.status[0];
      const sendedCount = latestProcess ? latestProcess.sendedCount : 0;
      const acceptCount = latestProcess ? latestProcess.acceptCount : 0;
      const residueCount = latestProcess ? latestProcess.residueCount : 0;
      const status = latestProcess ? latestProcess.status : "Pending";
      const statusDate = latestProcess ? latestProcess.date.toISOString() : new Date(0).toISOString();
      const isSent = status === "Yuborilgan";
      const isOutsourseCompany = latestProcess ? latestProcess.isOutsourseCompany : false;
      const outsourseCompanyId = latestProcess ? latestProcess.outsourseCompanyId : null;
      const outsourseName = latestProcess ? latestProcess.outsourseName : null;
      const normalizedDept = normalizeDepartment(pack.department);
      const logicalId = departmentOrderMap[normalizedDept]?.logicalId || 0;

      return {
        id: pack.id,
        department: pack.department,
        logicalId,
        protsessIsOver: pack.protsessIsOver,
        perentId: pack.perentId,
        ProductGroup: pack.productGroup,
        totalCount: pack.totalCount,
        sendedCount,
        acceptCount,
        residueCount,
        isSent,
        status,
        statusDate,
        isOutsourseCompany,
        outsourseCompanyId,
        outsourseName,
      };
    });

    // Consolidate packs by perentId and department
    const consolidatedMap: Map<string, FormattedProductPack> = new Map();

    formattedPacks.forEach((pack) => {
      const key = `${pack.perentId}-${normalizeDepartment(pack.department)}`;
      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, pack);
      } else {
        const existing = consolidatedMap.get(key)!;
        if (new Date(pack.statusDate) > new Date(existing.statusDate)) {
          consolidatedMap.set(key, pack);
        }
      }
    });

    // Convert to array, sort by logicalId
    const consolidatedPacksArray: ConsolidatedProductPack[] = Array.from(
      consolidatedMap.values()
    ).sort((a, b) => a.logicalId - b.logicalId).map(pack => ({
      id: pack.id,
      department: pack.department,
      logicalId: pack.logicalId,
      protsessIsOver: pack.protsessIsOver,
      perentId: pack.perentId,
      ProductGroup: pack.ProductGroup,
      totalCount: pack.totalCount,
      sendedCount: pack.sendedCount,
      acceptCount: pack.acceptCount,
      residueCount: pack.residueCount,
      isSent: pack.isSent,
      status: pack.status,
      isOutsourseCompany: pack.isOutsourseCompany,
      outsourseCompanyId: pack.outsourseCompanyId,
      outsourseName: pack.outsourseName,
    }));

    // Group by perentId
    const groupedByParentId: { [parentId: string]: ConsolidatedProductPack[] } = {};

    consolidatedPacksArray.forEach((pack) => {
      if (!groupedByParentId[pack.perentId]) {
        groupedByParentId[pack.perentId] = [];
      }
      groupedByParentId[pack.perentId].push(pack);
    });

    // Format response
    const responseData = Object.entries(groupedByParentId).map(([perentId, data]) => ({
      perentId,
      data,
    }));

    return res.status(200).json({
      success: true,
      count: responseData.length,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching consolidated status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch consolidated status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
