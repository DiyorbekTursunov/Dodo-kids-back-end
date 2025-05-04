// src/controllers/employeeController.ts
import { Request, Response } from "express";
import { PrismaClient, EmployeeType } from "@prisma/client";
import { createEmployee } from "../service/authService";
import { encodePassword } from "../lib/jwtPasswordUtils"; // We'll extract encoding here

const prisma = new PrismaClient();

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        login: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json(employees);
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    console.log(id);

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.status(200).json(employee);
  } catch (error) {
    console.error("Get employee error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createEmployeeHandler = async (req: Request, res: Response) => {
  try {
    const { login, password, type } = req.body;

    if (!login || !password || !type) {
      return res
        .status(400)
        .json({ error: "Login, password, and type are required" });
    }

    if (!Object.values(EmployeeType).includes(type as EmployeeType)) {
      return res.status(400).json({
        error: "Invalid employee type",
        validTypes: Object.values(EmployeeType),
      });
    }

    const employee = await createEmployee({
      login,
      password,
      type: type as EmployeeType,
    });

    return res.status(201).json(employee);
  } catch (error) {
    console.error("Create employee error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res
        .status(409)
        .json({ error: "Employee with this login already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { login, password, type } = req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!existingEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (!Object.values(EmployeeType).includes(type as EmployeeType)) {
      return res.status(400).json({
        error: "Invalid employee type",
        validTypes: Object.values(EmployeeType),
      });
    }

    const updateData: any = {};
    if (login) updateData.login = login;
    if (type) {
      if (!Object.values(EmployeeType).includes(type as EmployeeType)) {
        return res.status(400).json({
          error: "Invalid employee type",
          validTypes: Object.values(EmployeeType),
        });
      }
      updateData.type = type;
    }

    if (password) {
      updateData.password = encodePassword(password); // Use JWT to encode password
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        login: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Update employee error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res
        .status(409)
        .json({ error: "Employee with this login already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!existingEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await prisma.employee.delete({ where: { id } });
    return res.status(204).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
