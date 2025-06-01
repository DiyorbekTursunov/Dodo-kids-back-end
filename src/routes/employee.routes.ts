// employee.routes.ts - Complete routing setup
import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  getEmployeesByDepartment,
  updateEmployee,
} from "../controller/employee/employee.controller";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// CREATE - POST /employees
router.post("/", authenticate, createEmployee);

// READ - GET /employees (with query params for pagination and filtering)
// Example: GET /employees?page=1&limit=10&departmentId=uuid
router.get("/", getEmployees);

// READ - GET /employees/:id
router.get("/:id", getEmployeeById);

// UPDATE - PUT /employees/:id
router.put("/:id", authenticate, updateEmployee);

// DELETE - DELETE /employees/:id
router.delete("/:id", authenticate, deleteEmployee);

// UTILITY - GET /employees/department/:departmentId
router.get("/department/:departmentId", getEmployeesByDepartment);

export default router;
