import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addProductForWarehouseHandler = async (
  req: Request,
  res: Response
) => {
  const {
    userName,
    yuboruvchiBolimId,
    qabulQiluvchiBolimId,
    model,
    MatoTuri,
    umumiySoni,
    rangId,
    olchamId,
    qoshimchaIzoh,
  } = req.body;

  if (
    !userName ||
    !yuboruvchiBolimId ||
    !qabulQiluvchiBolimId ||
    !model ||
    !MatoTuri ||
    !umumiySoni ||
    !rangId ||
    !olchamId
  ) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    // ✅ Get departments
    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: [yuboruvchiBolimId, qabulQiluvchiBolimId],
        },
      },
    });

    if (departments.length < 2) {
      return res
        .status(404)
        .json({ error: "One or more departments not found" });
    }

    // ✅ Create main process with line
    const mainProtsess = await prisma.mainProtsess.create({
      data: {
        modelName: model,
        protsesIsOver: false,
        protsesIsStartedTime: new Date().toISOString(),
        protsesIsOverTime: "",
        completedSections: {
          create: [],
        },
        line: {
          create: [
            {
              protsessIsOver: false,
              department: departments[0].name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              umumiySoni: parseInt(umumiySoni),
              qabulQiluvchiBolim: departments[1].name,
              model: model,
              qoshilganlarSoni: 0,
              yuborilganlarSoni: [],
              status: ["Pending"],
              qoshimchaMalumotlar: qoshimchaIzoh,
              color: {
                connectOrCreate: {
                  where: { id: rangId },
                  create: { name: rangId },
                },
              },
              size: {
                connectOrCreate: {
                  where: { id: olchamId },
                  create: { name: olchamId },
                },
              },
              yaroqsizlarSoni: {
                create: [
                  {
                    sabali: "",
                    soni: 0,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        line: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Product and lines created successfully",
      data: mainProtsess,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
