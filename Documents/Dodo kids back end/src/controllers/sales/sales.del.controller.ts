import { Request, Response } from "express";
import prisma from "../../lib/prisma/client";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  name: string;
  iat: number;
}

export const delAllSales = async (req: Request, res: Response) => {};
