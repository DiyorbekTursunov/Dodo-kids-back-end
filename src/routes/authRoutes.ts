// src/routes/authRoutes.ts
import { adminLogin } from "../controller/auth/admin/adminLogin";
import { createAdminHandler } from "../controller/auth/admin/createAdmin";
import { employeeLogin } from "../controller/auth/employee/exployeeLogin";
import express, { Request, Response, NextFunction } from "express";


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
