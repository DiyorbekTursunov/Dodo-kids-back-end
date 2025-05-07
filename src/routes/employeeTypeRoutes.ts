// src/routes/colorRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { authenticate, isAdmin } from "../middleware/authMiddleware";
import { getAllEmployeeTypes } from "../controller/employeeType/getAllEmployeeType";
import { getEmployeeTypeById } from "../controller/employeeType/getByIdEmployeeType";
import { createEmployeeType } from "../controller/employeeType/createEmployeeType";
import { updateEmployeeType } from "../controller/employeeType/updateEmployeeType";
import { deleteEmployeeType } from "../controller/employeeType/deleteEmployeeType";

const router = express.Router();

// get all employee types
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getAllEmployeeTypes(req, res).catch(next);
});

// get employee type by id
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getEmployeeTypeById(req, res).catch(next);
});

// Admin-only routes for managing employee types
// Create a new employee type
router.post(
  "/",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    createEmployeeType(req, res).catch(next);
  }
);

// Update an existing employee type
router.put(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    updateEmployeeType(req, res).catch(next);
  }
);

// Delete an employee type
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    deleteEmployeeType(req, res).catch(next);
  }
);

export default router;
