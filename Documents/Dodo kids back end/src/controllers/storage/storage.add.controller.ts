import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { PhoneCondition, PhoneStatus } from "@prisma/client";

interface StorageInput {
  company: string;
  model: string;
  condition: PhoneCondition;
  imei: string;
  purchasePrice: number;
  purchaseDate: string | Date;
  status: PhoneStatus;
  fullName: string;
  phoneNumber: string;
}

interface JwtPayload {
  userId: string;
  name: string;
  iat: number;
}

export const addAllStorage = async (req: Request, res: Response) => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    // Verify and decode the token
    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decodedToken.userId;

    const {
      company,
      model,
      condition,
      imei,
      purchasePrice,
      purchaseDate,
      fullName,
      phoneNumber,
    }: StorageInput = req.body;

    // Validate required fields
    if (
      !company ||
      !model ||
      !condition ||
      !imei ||
      !purchasePrice ||
      !purchaseDate ||
      !fullName ||
      !phoneNumber
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingPhone = await prisma.storage.findUnique({
      where: { imei },
    });

    if (existingPhone) {
      return res
        .status(409)
        .json({ message: "IMEI already exists in storage." });
    }

    const newStorage = await prisma.storage.create({
      data: {
        company,
        model,
        condition,
        imei,
        purchaseId: uuidv4(),
        purchasePrice,
        purchaseDate: new Date(purchaseDate),
        fullName,
        phoneNumber,
        // Fix: Convert userId to number for Prisma
        userId,
      },
    });

    return res.status(201).json({
      message: "Storage created successfully",
      data: newStorage,
    });
  } catch (err) {
    console.error("Error creating storage item:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err });
  }
};
