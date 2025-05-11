import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get user (employee) by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: id }, // Ensure the ID is the right type
    });

    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Delete user (employee)
export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userExists = await prisma.user.findUnique({
      where: { id: id }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await prisma.user.delete({
      where: { id: id }
    });

    return res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({ error: 'Failed to delete employee' });
  }
};
