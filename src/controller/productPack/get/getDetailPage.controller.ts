// src/controllers/productPack.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProductPackById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const pack = await prisma.invoice.findUnique({
      where: { id },
      include: {
        ProductGroup: {
          include: {
            productGroupFiles: {
              include: {
                file: true,
              },
            },
            products: {
              include: {
                productSetting: {
                  include: {
                    sizeGroups: {
                      include: {
                        colorSizes: {
                          include: {
                            sizeGroup: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        status: {
          orderBy: {
            date: "desc",
          },
          take: 1, // latest status
        },
      },
    });

    if (!pack) {
      return res.status(404).json({ error: "Product pack not found" });
    }

    res.status(200).json({
      ...pack,
    });
  } catch (error) {
    console.error("Error fetching product pack:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
