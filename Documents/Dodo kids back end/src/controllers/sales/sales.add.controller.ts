import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  name: string;
  iat: number;
}

export const addAllSales = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  let decodedToken: JwtPayload;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const userId = decodedToken.userId;

  const {
    purchaseId,
    salePrice,
    profit,
    saleDate,
    fullName,
    phoneNumber,
  } = req.body;

  if (
    !purchaseId ||
    salePrice === undefined ||
    profit === undefined ||
    !saleDate ||
    !fullName ||
    !phoneNumber
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const storageItem = await prisma.storage.findUnique({
      where: { purchaseId },
    });

    if (!storageItem) {
      return res.status(404).json({ message: "Item not found in storage." });
    }

    // Create a new sale entry
    const newSale = await prisma.sales.create({
      data: {
        company: storageItem.company,
        model: storageItem.model,
        condition: storageItem.condition,
        imei: storageItem.imei,
        purchaseId: storageItem.purchaseId,
        purchasePrice: storageItem.purchasePrice,
        salePrice,
        profit,
        saleDate: new Date(saleDate),
        fullName,
        phoneNumber,
        userId,
      },
    });

    // Optionally delete the item from storage
    await prisma.storage.delete({
      where: { purchaseId },
    });

    return res.status(201).json({ message: "Sale added successfully", sale: newSale });
  } catch (err) {
    console.error("Error creating sale item:", err);
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};
