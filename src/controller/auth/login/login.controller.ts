import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const loginUser = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Login and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { login },
      include: { Employee: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    // Create JWT token (no expiration)
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        employee: user.Employee,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
