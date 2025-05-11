import { authenticate } from "../middleware/authMiddleware";
import express, { Request, Response, NextFunction } from "express";
import { getEmployees } from "../controller/employee/employee.get_all.controller";
import { getEmployeeById } from "../controller/employee/employee.get_id.controller";
import { updateEmployee } from "../controller/employee/employee.edit.controller";
import { createEmployee } from "../controller/employee/employee.create.controller";
import { deleteEmployee } from "../controller/employee/employee.del.controller";

const router = express.Router();

router.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createEmployee(req, res).catch(next);
  }
);

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getEmployees(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getEmployeeById(req, res).catch(next);
});

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
