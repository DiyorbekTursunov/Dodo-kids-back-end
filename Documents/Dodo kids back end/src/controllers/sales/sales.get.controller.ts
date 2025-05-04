import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  name: string;
  iat: number;
}

export const getAllSales = async (req: Request, res: Response) => {
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

    const userId = String(decodedToken.userId); // Ensure userId is a string

    // Get storage items for the authenticated user
    const allStorage = await prisma.sales.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(allStorage);
  } catch (err) {
    console.error("Error fetching storage items:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err });
  }
};
