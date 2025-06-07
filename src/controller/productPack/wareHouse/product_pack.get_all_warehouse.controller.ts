import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all Invoices with pagination and selective fields
export const getAllProductPacks = async (req: Request, res: Response) => {
  try {
    // Extract query parameters for pagination and filtering
    const { page = 1, limit = 10, status, departmentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build the where clause for filtering
    const where: any = {
      ...(status && { status: { some: { status: String(status) } } }),
      ...(departmentId && { departmentId: String(departmentId) }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        perentId: true,
        protsessIsOver: true,
        departmentId: true,
        department: true,
        totalCount: true,
        createdAt: true,
        updatedAt: true,
        productGroup: {
          select: {
            id: true,
            name: true,
            isSended: true,
            status: true,
            products: {
              select: {
                id: true,
                name: true,
                allTotalCount: true,
                isSended: true,
                status: true,
                productSettings: {
                  select: {
                    id: true,
                    totalCount: true,
                    isSended: true,
                    status: true,
                    sizeGroups: {
                      select: {
                        id: true,
                        size: true,
                        quantity: true,
                        status: true,
                        colorSizes: {
                          select: {
                            id: true,
                            quantity: true,
                            isSended: true,
                            status: true,
                            color: {
                              select: {
                                id: true,
                                name: true,
                              },
                            },
                            size: {
                              select: {
                                id: true,
                                name: true,
                                isSended: true,
                                status: true,
                              },
                            },
                            processes: {
                              select: {
                                id: true,
                                status: true,
                                protsessIsOver: true,
                                acceptCount: true,
                                sendedCount: true,
                                invalidCount: true,
                                residueCount: true,
                                invalidReason: true,
                              },
                              orderBy: { createdAt: "desc" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            productGroupFiles: {
              select: {
                id: true,
                file: {
                  select: {
                    id: true,
                    fileName: true,
                    path: true,
                    mimeType: true,
                    size: true,
                    fileType: true,
                  },
                },
              },
            },
          },
        },
        status: {
          select: {
            id: true,
            status: true,
            date: true,
            protsessIsOver: true,
            acceptCount: true,
            sendedCount: true,
            invalidCount: true,
            residueCount: true,
            invalidReason: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            outsourseName: true,
            isOutsourseCompany: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get total count for pagination
    const totalInvoices = await prisma.invoice.count({ where });

    res.status(200).json({
      data: invoices,
      meta: {
        total: totalInvoices,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalInvoices / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch invoices. Please try again later." });
  } finally {
    await prisma.$disconnect();
  }
};
