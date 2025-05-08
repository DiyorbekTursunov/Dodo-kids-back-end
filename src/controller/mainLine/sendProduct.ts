import { PrismaClient, Line, Department } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Interface for defective products
interface YaroqsizProduct {
  soni: number;
  sababi: string; // Note: Changed from sabali to sababi to match your request
}

interface CompleteProductTransferRequest {
  id: string;
  qabulQiluvchiBolimId?: string;
  yuborilganSoni: number; // Number of products to be sent
  yaroqsizlar?: YaroqsizProduct | YaroqsizProduct[]; // Can be single object or array
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
    const { id, qabulQiluvchiBolimId, yuborilganSoni, yaroqsizlar } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    if (yuborilganSoni === undefined || yuborilganSoni < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Valid yuborilganSoni (number of products to send) is required",
      });
    }

    // Process yaroqsizlar - handle both object and array formats
    let yaroqsizlarArray: YaroqsizProduct[] = [];

    if (yaroqsizlar) {
      // If it's a single object, convert to array
      if (!Array.isArray(yaroqsizlar)) {
        yaroqsizlarArray = [yaroqsizlar];
      } else {
        yaroqsizlarArray = yaroqsizlar;
      }

      // Validate each item
      for (const yaroqsiz of yaroqsizlarArray) {
        const soni = Number(yaroqsiz.soni); // Convert to number if string
        if (isNaN(soni) || soni < 0 || !yaroqsiz.sababi) {
          return res.status(400).json({
            success: false,
            message:
              "Each yaroqsiz item must have a valid soni (quantity) and sababi (reason)",
          });
        }
      }
    }

    try {
      // Get the line data
      const line = await prisma.line.findUnique({
        where: { id },
        include: {
          color: true,
          size: true,
          yaroqsizlarSoni: true,
        },
      });

      if (!line) {
        return res.status(404).json({
          success: false,
          message: "Line not found",
        });
      }

      // Calculate totals from the existing data
      const existingYuborilganlarSoni = line.yuborilganlarSoni.reduce(
        (sum, current) => sum + current,
        0
      );
      const existingYaroqsizlarSoni = line.yaroqsizlarSoni.reduce(
        (sum, item) => sum + item.soni,
        0
      );

      // Calculate new yaroqsizlar total from the request - convert string to number if needed
      const newYaroqsizlarSoni = yaroqsizlarArray.reduce(
        (sum, item) => sum + Number(item.soni),
        0
      );

      // Add the new yuborilganSoni to the array
      const updatedYuborilganlarSoni = [
        ...line.yuborilganlarSoni,
        yuborilganSoni,
      ];

      // Calculate the new total after adding current sent and defective amounts
      const newTotalYuborilganlarSoni =
        existingYuborilganlarSoni + yuborilganSoni;
      const newTotalYaroqsizlarSoni =
        existingYaroqsizlarSoni + newYaroqsizlarSoni;
      const totalProcessed =
        newTotalYuborilganlarSoni + newTotalYaroqsizlarSoni;

      // Validate that we're not processing more than what's available
      if (totalProcessed > line.qoshilganlarSoni) {
        return res.status(400).json({
          success: false,
          message:
            "The total of sent and defective products cannot exceed the added products (qoshilganlarSoni)",
        });
      }

      // Begin a transaction to ensure all operations succeed or fail together
      return await prisma.$transaction(async (prisma) => {
        // Step 1: Add new yaroqsizlar if provided
        if (yaroqsizlarArray.length > 0) {
          for (const yaroqsiz of yaroqsizlarArray) {
            await prisma.useless.create({
              data: {
                soni: Number(yaroqsiz.soni),
                sabali: yaroqsiz.sababi, // Using sababi from input, but database field is sabali
                lineId: id,
              },
            });
          }
        }

        // Step 2: Process the sending status
        let updateData: {
          status: string[];
          protsessIsOver?: boolean;
          yuborilganlarSoni: number[];
        } = {
          status: [...line.status],
          yuborilganlarSoni: updatedYuborilganlarSoni,
        };

        let statusMessage = "";
        let transferType = "";

        if (totalProcessed === line.qoshilganlarSoni) {
          // Condition 1: All products processed
          updateData = {
            status: ["yuborilmagan"],
            yuborilganlarSoni: updatedYuborilganlarSoni,
            protsessIsOver: true,
          };
          statusMessage = "All products processed successfully";
          transferType = "yuborilmagan";
        } else {
          // Condition 3: Not all products processed
          updateData = {
            status: ["to'liq yuborilmagan"],
            yuborilganlarSoni: updatedYuborilganlarSoni,
          };
          statusMessage = "Products partially processed";
          transferType = "to'liq yuborilmagan";
        }

        // Update the source line
        const updatedLine = await prisma.line.update({
          where: { id },
          data: updateData,
          include: {
            yaroqsizlarSoni: true,
          },
        });

        // Step 3: Create a new line for the receiving department if qabulQiluvchiBolimId is provided
        let newLine: Line | null = null;
        if (qabulQiluvchiBolimId && yuborilganSoni > 0) {
          // Get department info
          const department = await prisma.department.findUnique({
            where: { id: qabulQiluvchiBolimId },
          });

          if (!department) {
            throw new Error("Receiving department not found");
          }

          // Create a new line for the receiving department
          newLine = await prisma.line.create({
            data: {
              departmentId: qabulQiluvchiBolimId,
              department: department.name,
              color: {
                connect: line.color.map((c) => ({ id: c.id })),
              },
              size: {
                connect: line.size.map((s) => ({ id: s.id })),
              },
              umumiySoni: line.umumiySoni,
              qabulQiluvchiBolim: department.name,
              model: line.model,
              qoshilganlarSoni: yuborilganSoni, // Use the current sent amount, not the total
              yuborilganlarSoni: [],
              status: ["Pending"],
              qoshimchaMalumotlar: `Transferred from ${line.department}`,
              mainProtsessId: line.mainProtsessId,
            },
          });
        }

        return res.status(200).json({
          success: true,
          message: statusMessage,
          type: transferType,
          protsessIsOver: updatedLine.protsessIsOver,
          updatedLine,
          newLine,
        });
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database connection error",
        error:
          dbError instanceof Error ? dbError.message : "Unknown database error",
      });
    }
  } catch (error) {
    console.error("Error in completeProductTransferHandler:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
