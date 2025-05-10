// src/routes/authRoutes.ts
import { authenticate } from "../middleware/authMiddleware";
import { loginUser } from "../controller/auth/login/login.controller";
import { registerUser } from "../controller/auth/register/register.controller";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/register",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    registerUser(req, res).catch(next);
  }
);

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  loginUser(req, res).catch(next);
});

export default router;
