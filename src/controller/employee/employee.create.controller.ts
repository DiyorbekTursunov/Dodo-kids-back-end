import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Create user and employee
export const createEmployee = async (req: Request, res: Response) => {
  const { login, password, name, role, departmentId } = req.body;

  // Validate required fields
  if (!login) return res.status(400).json({ error: "Login is required" });
  if (!password) return res.status(400).json({ error: "Password is required" });
  if (!role) return res.status(400).json({ error: "Role is required" });
  if (!departmentId) return res.status(400).json({ error: "Department ID is required" });
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    // Check if user with the same login already exists
    const existingUser = await prisma.user.findUnique({
      where: { login }
    });

    if (existingUser) {
      return res.status(409).json({ error: "Login already taken" });
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and employee in a single transaction
    const newUser = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
        role,
        Employee: {
          create: {
            name,
            departmentId,
          },
        },
      },
      include: {
        Employee: {
          include: {
            department: true
          }
        },
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET
    );

    return res.status(201).json({
      message: "Employee registered successfully",
      token,
      user: {
        id: newUser.id,
        login: newUser.login,
        role: newUser.role,
        employee: newUser.Employee,
      },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
};
