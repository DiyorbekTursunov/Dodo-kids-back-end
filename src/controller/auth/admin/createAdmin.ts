// src/controllers/authController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { encodePassword } from "../../../lib/jwtPasswordUtils"; // adjust path as needed

const prisma = new PrismaClient();

export const createAdminHandler = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "This endpoint is disabled in production" });
    return;
  }

  const { login, password } = req.body;

  if (!login || !password) {
    res.status(400).json({ error: "Login and password are required" });
    return;
  }

  try {
    // Inlined createAdmin logic
    const encodedPassword = encodePassword(password);

    const admin = await prisma.admin.create({
      data: {
        login,
        password: encodedPassword,
      },
    });

    res.status(201).json({
      id: admin.id,
      login: admin.login,
    });
  } catch (error) {
    console.error("Create admin error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      res.status(409).json({ error: "Admin with this login already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
