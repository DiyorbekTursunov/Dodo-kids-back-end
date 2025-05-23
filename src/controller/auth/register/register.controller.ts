import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const registerUser = async (req: Request, res: Response) => {
  const { login, password, role, departmentId } = req.body;

  if (!login || !password || !role || !departmentId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      return res.status(409).json({ error: "Login already taken" });
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: "Invalid departmentId" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
        role,
        employee: {
          create: {
            name: department.name,
            departmentId,
          },
        },
      },
      select: {
        id: true,
        login: true,
        role: true,
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "Employee registered successfully",
      token,
      user: {
        id: newUser.id,
        login: newUser.login,
        role: newUser.role,
        employee: newUser.employee,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
