import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get Sent Product Packs for a Department with filtered statuses
export const getSentProductPacks = async (req: Request, res: Response) => {
  const { departmentId } = req.params;

  if (!departmentId) {
    return res.status(400).json({ error: "Department ID is required" });
  }

  try {
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Get product packs with status "Yuborilgan" or "To'liq yuborilmagan"
    const sentProductPacks = await prisma.productPack.findMany({
      where: {
        departmentId,
        status: {
          some: {
            status: {
              in: ["Yuborilgan", "To'liq yuborilmagan"]
            }
          }
        }
      },
      include: {
        Product: {
          include: {
            color: true,
            size: true
          }
        },
        // Only include status records with "Yuborilgan" or "To'liq yuborilmagan"
        status: {
          orderBy: {
            date: 'desc'
          },
          where: {
            status: {
              in: ["Yuborilgan", "To'liq yuborilmagan"]
            }
          }
        }
      }
    });

    res.status(200).json(sentProductPacks);
  } catch (err) {
    console.error("Error fetching sent product packs:", err);
    res.status(500).json({
      error: "Internal server error",
      details: (err as Error).message
    });
  }
};
