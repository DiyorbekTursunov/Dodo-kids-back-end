import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params; // Employee ID
  const { departmentId, login, password, role } = req.body;

  if (!departmentId && !login && !password && !role) {
    return res.status(400).json({ error: "No update data provided" });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        departmentId: true,
        userId: true,
        user: {
          select: {
            id: true,
            login: true,
            role: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!departmentExists) {
        return res.status(404).json({ error: "Department not found" });
      }
    }

    if (login && login !== employee.user.login) {
      const existingUser = await prisma.user.findUnique({
        where: { login },
      });

      if (existingUser && existingUser.id !== employee.userId) {
        return res.status(409).json({ error: "Login already taken" });
      }
    }

    const userUpdateData: any = {};
    if (login) userUpdateData.login = login;
    if (role) userUpdateData.role = role;
    if (password) userUpdateData.password = await bcrypt.hash(password, 10);

    const employeeUpdateData: any = {};
    if (departmentId) employeeUpdateData.departmentId = departmentId;

    const result = await prisma.$transaction(async (prisma) => {
      let updatedEmployee = employee;

      if (Object.keys(employeeUpdateData).length > 0) {
        updatedEmployee = await prisma.employee.update({
          where: { id },
          data: {
            ...employeeUpdateData,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            name: true,
            departmentId: true,
            userId: true,
            user: {
              select: {
                id: true,
                login: true,
                role: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: employee.userId },
          data: {
            ...userUpdateData,
            updatedAt: new Date(),
          },
        });
      }

      const updatedUser = await prisma.user.findUnique({
        where: { id: employee.userId },
        select: {
          id: true,
          login: true,
          role: true,
        },
      });

      return {
        ...updatedEmployee,
        user: updatedUser,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating employee:", error);
    return res.status(500).json({ error: "Failed to update employee" });
  }
};
