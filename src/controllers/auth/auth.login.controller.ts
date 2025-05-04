import { Request, Response } from 'express';
import prisma from '../../lib/prisma/client';
import jwt from 'jsonwebtoken';

// Login endpoint
export const login = async (req: Request, res: Response): Promise<Response>  => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await prisma.user.findUnique({ where: { login } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the plain text password (no hashing)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, name: user.login },
      process.env.JWT_SECRET!  // No expiration
    );

    // Respond with the token and user data (excluding password)
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.login,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err });
  }
};
