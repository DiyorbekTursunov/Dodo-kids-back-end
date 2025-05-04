// src/service/authService.ts
import { PrismaClient, EmployeeType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Interface for login data
interface LoginData {
  login: string;
  password: string;
}

// Interface for employee creation
interface EmployeeData extends LoginData {
  type: EmployeeType;
}

// Generate JWT token for authentication (after login)
const generateToken = (user: any, isAdmin: boolean = false) => {
  const payload = {
    id: user.id,
    login: user.login,
    ...(isAdmin ? { isAdmin: true } : { type: user.type }),
  };

  return jwt.sign(payload, JWT_SECRET);
};

// Encode password using JWT
const encodePassword = (password: string): string => {
  return jwt.sign({ password }, JWT_SECRET);
};

// Decode password from JWT
const decodePassword = (token: string): string => {
  const decoded = jwt.verify(token, JWT_SECRET) as { password: string };
  return decoded.password;
};

// Employee login
export const loginEmployee = async (data: LoginData) => {
  const employee = await prisma.employee.findUnique({
    where: { login: data.login }
  });

  if (!employee) {
    throw new Error('Invalid login credentials');
  }

  const decodedPassword = decodePassword(employee.password);
  if (decodedPassword !== data.password) {
    throw new Error('Invalid login credentials');
  }

  const token = generateToken(employee);
  return {
    token,
    employee: {
      id: employee.id,
      login: employee.login,
      type: employee.type
    }
  };
};

// Admin login
export const loginAdmin = async (data: LoginData) => {
  const admin = await prisma.admin.findUnique({
    where: { login: data.login }
  });

  if (!admin) {
    throw new Error('Invalid login credentials');
  }

  const decodedPassword = decodePassword(admin.password);
  if (decodedPassword !== data.password) {
    throw new Error('Invalid login credentials');
  }

  const token = generateToken(admin, true);
  return {
    token,
    admin: {
      id: admin.id,
      login: admin.login
    }
  };
};

// Create employee (admin only)
export const createEmployee = async (data: EmployeeData) => {
  const encodedPassword = encodePassword(data.password);

  const employee = await prisma.employee.create({
    data: {
      login: data.login,
      password: encodedPassword,
      type: data.type
    }
  });

  return {
    id: employee.id,
    login: employee.login,
    type: employee.type
  };
};

// Create admin (development only)
export const createAdmin = async (data: LoginData) => {
  const encodedPassword = encodePassword(data.password);

  const admin = await prisma.admin.create({
    data: {
      login: data.login,
      password: encodedPassword
    }
  });

  return {
    id: admin.id,
    login: admin.login
  };
};
