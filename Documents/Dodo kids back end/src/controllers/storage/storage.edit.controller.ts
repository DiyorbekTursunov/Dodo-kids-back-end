import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";
import { PhoneCondition, PhoneStatus } from "@prisma/client";

interface StorageUpdateInput {
  company?: string;
  model?: string;
  condition?: PhoneCondition;
  imei?: string;
  purchasePrice?: number;
  purchaseDate?: string | Date;
  status?: PhoneStatus;
  fullName?: string;
  phoneNumber?: string;
}

export const editStorage = async (req: Request, res: Response) => {
  try {
    const { id, imei }: { id: string; imei?: string } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Storage ID is required" });
    }

    // Check if storage item exists
    const storageItem = await prisma.storage.findUnique({ where: { id } });

    if (!storageItem) {
      return res.status(404).json({ message: "Storage item not found" });
    }

    // Check for IMEI conflict only if it's being changed
    if (imei && imei !== storageItem.imei) {
      const existingPhone = await prisma.storage.findUnique({
        where: { imei },
      });

      if (existingPhone && existingPhone.id !== id) {
        return res
          .status(409)
          .json({ message: "IMEI already exists in storage." });
      }
    }

    const updateData: StorageUpdateInput = req.body;

    // Convert purchaseDate to Date if needed
    const dataToUpdate: any = { ...updateData };
    if (updateData.purchaseDate) {
      dataToUpdate.purchaseDate = new Date(updateData.purchaseDate);
    }

    const updatedStorage = await prisma.storage.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.status(200).json({
      message: "Storage item updated successfully",
      data: updatedStorage,
    });
  } catch (err) {
    console.error("Error updating storage item:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};
