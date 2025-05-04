// src/routes/employeeRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployeeHandler,
  updateEmployee,
  deleteEmployee,
} from "../controller/employeeController";

const router = express.Router();

router.get(
  "/",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    getAllEmployees(req, res).catch(next);
  }
);
router.get(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    getEmployeeById(req, res).catch(next);
  }
);
router.post(
  "/",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    createEmployeeHandler(req, res).catch(next);
  }
);
router.put(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    updateEmployee(req, res).catch(next);
  }
);
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    deleteEmployee(req, res).catch(next);
  }
);

export default router;
