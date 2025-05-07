// src/routes/employeeRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware";
import { getAllEmployees } from "../controller/emplyee/getAllEmployees";
import { getEmployeeById } from "../controller/emplyee/getEmployeeById";
import { createEmployeeHandler } from "../controller/emplyee/createEmployee";
import { updateEmployee } from "../controller/emplyee/updateEmployee";
import { deleteEmployee } from "../controller/emplyee/deleteEmployee";

const router = express.Router();

router.get(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getAllEmployees(req, res).catch(next);
  }
);
router.get(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    getEmployeeById(req, res).catch(next);
  }
);
router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createEmployeeHandler(req, res).catch(next);
  }
);
router.put(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    updateEmployee(req, res).catch(next);
  }
);
router.delete(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    deleteEmployee(req, res).catch(next);
  }
);

export default router;
