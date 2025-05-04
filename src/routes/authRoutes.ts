// src/routes/authRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { employeeLogin, adminLogin, createAdminHandler } from '../controller/authController';

const router = express.Router();

router.post('/employee/login', (req: Request, res: Response, next: NextFunction) => {
    employeeLogin(req, res).catch(next);
});
router.post('/admin/login', (req: Request, res: Response, next: NextFunction) => {
    adminLogin(req, res).catch(next);
});
router.post('/admin/create', (req: Request, res: Response, next: NextFunction) => {
    createAdminHandler(req, res).catch(next);
});

export default router;
