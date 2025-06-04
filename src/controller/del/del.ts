import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const forceDeleteAllHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete ColorSizeProcess (references ProductColorSize and ProductProcess)
      await tx.colorSizeProcess.deleteMany();

      // Delete ProductProcess (references Product and Invoice)
      await tx.productProcess.deleteMany();

      // Delete ProductProtsess (references Invoice and possibly OutsourseCompany)
      await tx.productProtsess.deleteMany();

      // Delete Invoice (references ProductGroup)
      await tx.invoice.deleteMany();

      // Delete ProductColorSize (references SizeGroup)
      await tx.productColorSize.deleteMany();

      // Delete SizeGroup (references productSetting)
      await tx.sizeGroup.deleteMany();

      // Delete productSetting (references Product)
      await tx.productSetting.deleteMany();

      // Delete Product (references ProductGroup)
      await tx.product.deleteMany();

      // Delete ProductGroupFile (references ProductGroup and File)
      await tx.productGroupFile.deleteMany();

      // Delete ProductGroup
      await tx.productGroup.deleteMany();

      // Delete File
      await tx.file.deleteMany();

      // Delete OutsourseCompany
      await tx.outsourseCompany.deleteMany();
    });

    return res.status(200).json({ message: 'Force delete completed successfully.' });
  } catch (error) {
    console.error('Force delete error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
};
