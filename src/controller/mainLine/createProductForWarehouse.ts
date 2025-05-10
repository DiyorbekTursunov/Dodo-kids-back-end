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
    userId,
  } = req.body;

  if (
    !userName ||
    !yuboruvchiBolimId ||
    !qabulQiluvchiBolimId ||
    !model ||
    !MatoTuri ||
    !umumiySoni ||
    !rangId ||
    !olchamId ||
    !userId
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

    const sender = departments.find((d) => d.id === yuboruvchiBolimId);
    const receiver = departments.find((d) => d.id === qabulQiluvchiBolimId);

    if (!sender || !receiver) {
      return res
        .status(404)
        .json({ error: "Sender or receiver department not found" });
    }

    // ✅ Create main process with line
    const mainProtsess = await prisma.mainProtsess.create({
      data: {
        modelName: model,
        protsesIsOver: false,
        protsesIsStartedTime: new Date().toISOString(),
        protsesIsOverTime: "",
        line: {
          create: [
            {
              protsessIsOver: false,
              departmentId: yuboruvchiBolimId,
              department: sender.name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              umumiySoni: isNaN(Number(umumiySoni)) ? 0 : Number(umumiySoni),
              qabulQiluvchiBolim: receiver.name,
              model: model,
              qoshilganlarSoni: umumiySoni,
              qoldiqSolni: 0,
              yuborilganlarSoni: [],
              status: {
                create: {
                  status: "qabul qilingan",
                  userId: userId,
                  size: {
                    connectOrCreate: {
                      where: { id: olchamId },
                      create: { name: olchamId },
                    },
                  },
                  color: {
                    connectOrCreate: {
                      where: { id: rangId },
                      create: { name: rangId },
                    },
                  },
                },
              },
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
                    sabali: "initial",
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

    console.log("Creating main process with payload:");
    console.log(JSON.stringify(req.body, null, 2));

    console.log("Created main process:", mainProtsess);

    return res.status(201).json({
      message: "Product and lines created successfully",
      data: mainProtsess,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
