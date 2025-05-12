import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const forceDeleteAllHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all ProductProtsess entries
      await tx.productProtsess.deleteMany();

      // 2. Delete all ProductPack entries
      await tx.productPack.deleteMany();

      // 3. Disconnect color and size relations before deleting Product
      const allProducts = await tx.product.findMany({
        select: { id: true },
      });

      for (const product of allProducts) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            color: { set: [] },
            size: { set: [] },
          },
        });
      }

      // 4. Delete all Product entries
      await tx.product.deleteMany();
    });

    return res.status(200).json({ message: 'Force delete completed successfully.' });
  } catch (error) {
    console.error('Force delete error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error });
  }
};
