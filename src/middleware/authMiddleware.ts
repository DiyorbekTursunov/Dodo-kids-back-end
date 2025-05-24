import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "b3c8f9e2d5a74f1a9c2e3d4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z";

console.log(JWT_SECRET);


// Extend Express.Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;      // changed from number to string (UUID)
        login: string;
        role: "ADMIN" | "USER";
      };
    }
  }
}

// ✅ Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "ADMIN" | "USER";
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = {
      id: user.id,
      login: user.login,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ✅ Admin check middleware
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied: Admin privileges required" });
    return;
  }
  next();
};
