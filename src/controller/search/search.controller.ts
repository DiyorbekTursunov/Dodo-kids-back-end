import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const searchInvoices = async (req: Request, res: Response) => {
  try {
    const { statuses, productName, departmentId } = req.query;

    // Parse statuses into an array
    let statusList: string[] = [];
    if (typeof statuses === "string") {
      statusList = statuses.split(",");
    } else if (Array.isArray(statuses)) {
      statusList = statuses.map((s) => s.toString());
    }

    // If "Yuborilgan" or "Toliq yuborilmagan" is included, return both
    if (
      statusList.includes("Yuborilgan") ||
      statusList.includes("Toliq yuborilmagan")
    ) {
      statusList = [
        ...new Set([...statusList, "Yuborilgan", "Toliq yuborilmagan"]),
      ];
    }

    // Build the where clause for filtering
    const where: any = {};

    if (statusList.length > 0) {
      where.status = {
        some: {
          status: {
            in: statusList,
          },
        },
      };
    }

    if (productName) {
      where.ProductGroup = {
        products: {
          some: {
            name: {
              contains: productName.toString(),
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (departmentId) {
      where.departmentId = departmentId.toString();
    }

    // Fetch invoices with filters
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        ProductGroup: {
          include: {
            products: true,
          },
        },
        status: true,
      },
    });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error searching invoices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchProductGroups = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    // Validate name parameter
    if (!name) {
      return res.status(400).json({ error: "Name parameter is required" });
    }

    // Search ProductGroups by name
    const productGroups = await prisma.product.findMany({
      where: {
        name: { contains: name.toString(), mode: "insensitive" },
      },

      include: {
        productSetting: {
          include: {
            // productSettingFiles: {
            //   include: {
            //     file: true,
            //   },
            // },
            product: true,
          },
        },
      },
    });

    res.status(200).json(productGroups);
  } catch (error) {
    console.error("Error searching product groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
