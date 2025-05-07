import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { decodePassword } from "../../../lib/jwtPasswordUtils"; // adjust path
import { generateToken } from "../../../lib/jwtPasswordUtils"; // adjust path

const prisma = new PrismaClient();

export const employeeLogin = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: "Login and password are required" });
    }

    const employee = await prisma.employee.findUnique({
      where: { login },
      include: {
        department: true,
      },
    });

    if (!employee) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    const decodedPassword = decodePassword(employee.password);
    if (decodedPassword !== password) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    const token = generateToken({
      id: employee.id,
      login: employee.login,
      type: employee.department,
    });

    return res.status(200).json({
      token,
      employee: {
        id: employee.id,
        login: employee.login,
        type: employee.department,
      },
    });
  } catch (error) {
    console.error("Employee login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
