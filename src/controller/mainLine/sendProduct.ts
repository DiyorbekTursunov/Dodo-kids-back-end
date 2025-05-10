import { PrismaClient, Line } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface YaroqsizProduct {
  soni: number;
  sababi: string;
}

interface CompleteProductTransferRequest {
  id: string;
  qabulQiluvchiBolimId?: string;
  yuborilganSoni: number;
  yaroqsizlar?: YaroqsizProduct | YaroqsizProduct[];
  userId: string;
  userName: string;
}

interface CompleteProductTransferResponse {
  success: boolean;
  message: string;
  type?: string;
  protsessIsOver?: boolean;
  updatedLine?: Line;
  newLine?: Line | null;
  error?: string;
}

export const completeProductTransferHandler = async (
  req: Request<{}, {}, CompleteProductTransferRequest>,
  res: Response<CompleteProductTransferResponse>
): Promise<Response<CompleteProductTransferResponse>> => {
  try {
    const { id, userId, qabulQiluvchiBolimId } = req.body;
    // Ensure yuborilganSoni is parsed as a number
    const yuborilganSoni = Number(req.body.yuborilganSoni);
    const yaroqsizlar = req.body.yaroqsizlar;

    if (!id || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "ID and userID are required" });
    }

    if (isNaN(yuborilganSoni) || yuborilganSoni < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid yuborilganSoni (>= 0) is required",
      });
    }

    // Normalize yaroqsizlar to array
    const yaroqsizlarArray: YaroqsizProduct[] = Array.isArray(yaroqsizlar)
      ? yaroqsizlar
      : yaroqsizlar
      ? [yaroqsizlar]
      : [];

    for (const item of yaroqsizlarArray) {
      const soni = Number(item.soni);
      if (isNaN(soni) || soni < 0 || !item.sababi?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Each yaroqsiz item must have a valid soni and sababi",
        });
      }
    }

    const line = await prisma.line.findUnique({
      where: { id },
      include: { color: true, size: true, yaroqsizlarSoni: true },
    });

    if (!line) {
      return res
        .status(404)
        .json({ success: false, message: "Line not found" });
    }

    // Calculate existing values correctly
    const existingYuborilganSoni = line.yuborilganlarSoni.reduce(
      (sum, val) => sum + Number(val),
      0
    );

    const existingYaroqsizSoni = line.yaroqsizlarSoni.reduce(
      (sum, val) => sum + Number(val.soni),
      0
    );

    const newYaroqsizSoni = yaroqsizlarArray.reduce(
      (sum, val) => sum + Number(val.soni),
      0
    );

    const updatedYuborilganlarSoni = [
      ...line.yuborilganlarSoni,
      yuborilganSoni,
    ];

    // Calculate the total processed, ensuring all values are proper numbers
    const totalProcessed =
      existingYuborilganSoni +
      yuborilganSoni +
      existingYaroqsizSoni +
      newYaroqsizSoni;

    // Debug logging
    console.log(
      "Total processed:",
      totalProcessed,
      "Available:",
      line.qoshilganlarSoni
    );

    const qoldiqSon = line.umumiySoni - totalProcessed;

    if (totalProcessed > Number(line.qoshilganlarSoni)) {
      return res.status(400).json({
        success: false,
        message: "Total processed exceeds qoshilganlarSoni",
      });
    }

    // Increase transaction timeout to 15 seconds (15000ms)
    return await prisma.$transaction(
      async (tx) => {
        // Save yaroqsizlar - do this first to avoid the line creation timing out
        const yaroqsizPromises = yaroqsizlarArray.map((item) => {
          return tx.useless.create({
            data: {
              soni: Number(item.soni),
              sabali: item.sababi, // Note: database field is sabali but input is sababi
              lineId: id,
            },
          });
        });

        if (yaroqsizlarArray.length > 0) {
          await Promise.all(yaroqsizPromises);
        }

        // Check if process is completed
        const protsessIsOver = totalProcessed === Number(line.qoshilganlarSoni);
        const type = protsessIsOver ? "yuborilgan" : "to'liq yuborilmagan";
        const message = protsessIsOver
          ? "All products processed successfully"
          : "Products partially processed";

        // Update the line first
        const updatedLine = await tx.line.update({
          where: { id },
          data: {
            yuborilganlarSoni: updatedYuborilganlarSoni,
            status: {
              create: [
                {
                  status: type,
                  userId,
                //   userName,
                },
              ],
            },
            protsessIsOver,
          },
          include: { yaroqsizlarSoni: true },
        });

        let newLine: Line | null = null;

        // Only try to create a new line if receiving department is specified
        if (qabulQiluvchiBolimId && yuborilganSoni > 0) {
          const receiver = await tx.department.findUnique({
            where: { id: qabulQiluvchiBolimId },
          });

          if (!receiver) {
            throw new Error("Receiving department not found");
          }

          // Create a new line for the receiving department with minimal data
          newLine = await tx.line.create({
            data: {
              departmentId: receiver.id,
              department: receiver.name,
              color: { connect: line.color.map((c) => ({ id: c.id })) },
              size: { connect: line.size.map((s) => ({ id: s.id })) },
              umumiySoni: line.umumiySoni,
              qoshilganlarSoni: yuborilganSoni,
              qabulQiluvchiBolim: receiver.name,
              qoldiqSolni: qoldiqSon,
              model: line.model,
              yuborilganlarSoni: [],
            //   umomiyYaroqsizlarSoni: 0,
            //   umumiyYuborilganlarSoni: 0,
              status: {
                create: [
                  {
                    status: "Pending",
                    userId,
                    // userName,
                  },
                ],
              },
              qoshimchaMalumotlar: `Transferred from ${line.department}`,
              mainProtsessId: line.mainProtsessId,
            },
          });
        }

        return res.status(200).json({
          success: true,
          message,
          type,
          protsessIsOver,
          updatedLine,
          newLine,
        });
      },
      {
        timeout: 15000, // 15 seconds timeout instead of default 5 seconds
        maxWait: 5000, // Maximum amount of time to wait to acquire the initial lock
      }
    );
  } catch (error) {
    console.error("Error completing transfer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
