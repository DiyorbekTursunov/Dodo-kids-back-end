import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";

export const deleteStorage = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Storage ID is required" });
    }

    // Check if storage item exists
    const storageItem = await prisma.storage.findUnique({
      where: { id }
    });

    if (!storageItem) {
      return res.status(404).json({ message: "Storage item not found" });
    }

    // Delete the storage item
    await prisma.storage.delete({
      where: { id }
    });

    return res.status(200).json({ message: "Storage item deleted successfully" });
  } catch (err) {
    console.error("Error deleting storage item:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err });
  }
};
