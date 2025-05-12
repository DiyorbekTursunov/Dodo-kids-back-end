import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Update employee and associated user
export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { departmentId, login, password, role } = req.body;

  // Check if at least one field to update is provided
  if (!departmentId && !login && !password && !role) {
    return res.status(400).json({ error: "No update data provided" });
  }

  try {
    // Check if employee exists and include user data
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // If departmentId provided, check if department exists
    if (departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: departmentId }
      });

      if (!departmentExists) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }

    // If login provided, check if it's already taken by another user
    if (login && login !== employee.user.login) {
      const existingUser = await prisma.user.findUnique({
        where: { login }
      });

      if (existingUser && existingUser.id !== employee.userId) {
        return res.status(409).json({ error: 'Login already taken' });
      }
    }

    // Prepare user data update if needed
    const userUpdateData: any = {};
    if (login) userUpdateData.login = login;
    if (role) userUpdateData.role = role;
    if (password) userUpdateData.password = await bcrypt.hash(password, 10);

    // Prepare employee data update
    const employeeUpdateData: any = {};
    if (departmentId) employeeUpdateData.departmentId = departmentId;

    // Start a transaction to update both employee and user
    const result = await prisma.$transaction(async (prisma) => {
      // Update employee data if there are changes
      let updatedEmployee = employee;

      if (Object.keys(employeeUpdateData).length > 0) {
        updatedEmployee = await prisma.employee.update({
          where: { id },
          data: {
            ...employeeUpdateData,
            updatedAt: new Date(),
          },
          include: {
            user: true,
            department: true
          }
        });
      }

      // Update user data if there are changes
      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: employee.userId },
          data: {
            ...userUpdateData,
            updatedAt: new Date(),
          }
        });

        // Get the updated user data
        const updatedUser = await prisma.user.findUnique({
          where: { id: employee.userId },
          select: {
            id: true,
            login: true,
            role: true,
          }
        });

        // Return updated employee with the latest user data
        return {
          ...updatedEmployee,
          user: updatedUser
        };
      }

      return updatedEmployee;
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ error: 'Failed to update employee' });
  }
};
