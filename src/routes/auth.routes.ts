// src/routes/authRoutes.ts
import { authenticate } from "../middleware/authMiddleware";
import { loginUser } from "../controller/auth/login/login.controller";
import { registerUser } from "../controller/auth/register/register.controller";
import express, { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../controller/auth/middeware/authRoutes";

const router = express.Router();

router.post(
  "/register",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    registerUser(req, res).catch(next);
  }
);

router.get(
  "/auth/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.status(200).json({
      id: req.user.id,
      login: req.user.login,
      role: req.user.role,
    });
  })
);

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  loginUser(req, res).catch(next);
});

export default router;
