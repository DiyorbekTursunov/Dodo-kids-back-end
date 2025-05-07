// src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { decodePassword } from '../../../lib/jwtPasswordUtils'; // adjust as needed
import { generateToken } from '../../../lib/jwtPasswordUtils'; // adjust as needed

const prisma = new PrismaClient();

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const admin = await prisma.admin.findUnique({
      where: { login }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const decodedPassword = decodePassword(admin.password);
    if (decodedPassword !== password) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const token = generateToken(admin); // assumes this works with admin too

    return res.status(200).json({
      token,
      admin: {
        id: admin.id,
        login: admin.login
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
