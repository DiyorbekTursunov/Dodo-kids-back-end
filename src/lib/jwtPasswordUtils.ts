// src/utils/jwtPasswordUtils.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET); // You can also add expiresIn if needed
};

export const encodePassword = (password: string): string => {
  return jwt.sign({ password }, JWT_SECRET);
};

export const decodePassword = (token: string): string => {
  const decoded = jwt.verify(token, JWT_SECRET) as { password: string };
  return decoded.password;
};
