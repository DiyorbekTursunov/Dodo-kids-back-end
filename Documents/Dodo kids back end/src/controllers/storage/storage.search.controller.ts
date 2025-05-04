import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  name: string;
  iat: number;
}

export const searchStorage = async (req: Request, res: Response) => {
  try {
    // Get token from header
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

    const { query } = req.body;
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "Search query is required and must be a non-empty string." });
    }

    const fieldsToSearch = ["company", "model", "imei", "fullName", "phoneNumber", "purchaseId"];

    const searchResults = await prisma.storage.findMany({
      where: {
        userId: decodedToken.userId,
        OR: fieldsToSearch.map((field) => ({
          [field]: {
            contains: query,
            mode: "insensitive",
          },
        })),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(searchResults);
  } catch (err) {
    console.error("Error searching storage items:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};
