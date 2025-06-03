import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const forceDeleteAllHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all ProductProtsess entries
      await tx.productProtsess.deleteMany();

      // 2. Delete all Invoice entries (to satisfy foreign key constraints)
      await tx.invoice.deleteMany();

      // 3. Delete all ProductGroup entries
      await tx.productGroup.deleteMany();

      // 4. Delete all ProductColorSize entries
      await tx.productColorSize.deleteMany();

      // 5. Delete all SizeGroup entries
      await tx.sizeGroup.deleteMany();

      // 6. Delete all ProductSetting entries
      await tx.productSetting.deleteMany();

      // 7. Delete all Product entries
      await tx.product.deleteMany();

    });

    return res.status(200).json({ message: 'Force delete completed successfully.' });
  } catch (error) {
    console.error('Force delete error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
};
