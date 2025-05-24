import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "b3c8f9e2d5a74f1a9c2e3d4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z";

export const loginUser = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  console.log({ login: JWT_SECRET });

  if (!login || !password) {
    return res.status(400).json({ error: "Login and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        role: true,
        password: true, // Needed for comparison, not returned
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        employee: user.employee,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
