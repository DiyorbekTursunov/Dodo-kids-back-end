import { Request, Response } from 'express';
import prisma from '../../lib/prisma/client';
import jwt from 'jsonwebtoken';


// Register endpoint
export const register = async (req: Request, res: Response): Promise<Response>  => {
  try {
    const { login, password } = req.body;

    // Validate request body
    if (!login || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this username already exists' });
    }

    // Create new user in the database (store password in plain text)
    const user = await prisma.user.create({
      data: {
        login,
        password,  // storing the password as it is (no hashing)
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, name: user.login },
      process.env.JWT_SECRET!
    );

    // Respond with the token and user data (excluding password)
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.login,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal server error', error: err });
  }
};
