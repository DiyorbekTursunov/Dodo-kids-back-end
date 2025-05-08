import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const acceptanceProduct = async (req: Request, res: Response) => {
  const { mainProtsessId, lineId, yaroqsizlar } = req.body;

  if (!mainProtsessId || !lineId) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    // ✅ Check if MainProtsess exists
    const mainProtsess = await prisma.mainProtsess.findUnique({
      where: { id: mainProtsessId },
    });

    if (!mainProtsess) {
      return res.status(404).json({ error: "Main process not found" });
    }

    // ✅ Find the line
    const line = await prisma.line.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      return res.status(404).json({ error: "Line not found" });
    }

    // ✅ Build the update data conditionally
    const updateData: any = {
      status: ["qabul qilingan"],
      qoshilganlarSoni: line.umumiySoni,
    };

    if (yaroqsizlar) {
      updateData.yaroqsizlarSoni = {
        create: [
          {
            soni: Number(yaroqsizlar?.soni) || 0,
            sabali: yaroqsizlar?.sababi || "Noma'lum",
          },
        ],
      };
    }

    // ✅ Update the line
    const updatedLine = await prisma.line.update({
      where: { id: lineId },
      data: updateData,
      include: {
        yaroqsizlarSoni: true,
      },
    });

    return res.status(200).json({
      message: "Line accepted successfully",
      data: updatedLine,
    });
  } catch (error) {
    console.error("Error in acceptanceProduct:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
