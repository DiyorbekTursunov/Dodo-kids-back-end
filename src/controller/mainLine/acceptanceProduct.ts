import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AcceptanceProductRequest {
  mainProtsessId: string;
  lineId: string;
  userId: string;
  userName: string;
  olchamId: string; // Size ID field
  rangId: string; // Color ID field
  yaroqsizlar?: {
    soni: number;
    sababi: string;
  };
}

export const acceptanceProduct = async (
  req: Request<{}, {}, AcceptanceProductRequest>,
  res: Response
) => {
  const { mainProtsessId, lineId, userId, userName, yaroqsizlar } = req.body;

  // Validate required fields
  if (!mainProtsessId || !lineId || !userId || !userName) {
    return res.status(400).json({
      success: false,
      message:
        "Required fields are missing. mainProtsessId, lineId, userId, olchamId, and rangId are required.",
    });
  }

  try {
    // Check if MainProtsess exists
    const mainProtsess = await prisma.mainProtsess.findUnique({
      where: { id: mainProtsessId },
    });

    if (!mainProtsess) {
      return res.status(404).json({
        success: false,
        message: "Main process not found",
      });
    }

    // Find the line
    const line = await prisma.line.findUnique({
      where: { id: lineId },
      include: {
        color: true,
        size: true,
        status: true,
      },
    });

    if (!line) {
      return res.status(404).json({
        success: false,
        message: "Line not found",
      });
    }

    // Process the transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // First delete any pending status for this line
        await tx.status.deleteMany({
          where: {
            productId: lineId,
            // userName: userName,
            status: "Pending",
          },
        });

        // Build update data with the status structure as required
        const updateData = {
          // Set qoshilganlarSoni to umumiySoni as specified
          qoshilganlarSoni: line.umumiySoni,
          status: {
            create: {
              status: "qabul qilingan",
              userId: userId,
              userName: userName,
            },
          },
        };

        // Handle yaroqsizlar if provided
        if (
          yaroqsizlar &&
          typeof yaroqsizlar.soni === "number" &&
          yaroqsizlar.soni > 0
        ) {
          await tx.useless.create({
            data: {
              soni: Number(yaroqsizlar.soni),
              sabali: yaroqsizlar.sababi || "Noma'lum",
              lineId: lineId,
            },
          });
        }

        // Update the line with all the data
        const updatedLine = await tx.line.update({
          where: { id: lineId },
          data: updateData,
          include: {
            yaroqsizlarSoni: true,
            color: true,
            size: true,
            status: {
              include: {
                color: true,
                size: true,
              },
            },
          },
        });
        return updatedLine;
      },
      {
        timeout: 10000, // 10 seconds timeout to avoid the timeout issue
      }
    );

    // Check if the ombor (warehouse) is accepted
    const ombor = await prisma.line.findFirst({
      where: {
        department: "ombor",
      },
    });

    // Check if the line is qadoqlash (packaging)
    const isQadoqlash = await prisma.line.findFirst({
      where: {
        id: lineId,
        department: "qadoqlash",
      },
    });

    if (!ombor && !isQadoqlash) {
      await prisma.mainProtsess.update({
        where: {
          id: mainProtsessId,
        },
        data: {
          protsesIsOver: true,
          protsesIsStartedTime: new Date(), // Set completion time to now
        },
      });
    }
  } catch (error) {
    console.error("Error in acceptanceProduct:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
