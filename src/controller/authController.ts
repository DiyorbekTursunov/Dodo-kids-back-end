// src/controllers/authController.ts
import { Request, Response } from 'express';
import { loginEmployee, loginAdmin, createAdmin } from '../service/authService';

export const employeeLogin = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const result = await loginEmployee({ login, password });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Employee login error:', error);
    if (error instanceof Error && error.message === 'Invalid login credentials') {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const result = await loginAdmin({ login, password });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin login error:', error);
    if (error instanceof Error && error.message === 'Invalid login credentials') {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAdminHandler = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is disabled in production' });
  }

  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const admin = await createAdmin({ login, password });
    return res.status(201).json(admin);
  } catch (error) {
    console.error('Create admin error:', error);
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return res.status(409).json({ error: 'Admin with this login already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
