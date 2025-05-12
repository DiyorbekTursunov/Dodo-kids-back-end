import { authenticate } from "../middleware/authMiddleware";
import { createDepartment } from "../controller/department/department.create.controller";
import { deleteDepartment } from "../controller/department/department.del.controller";
import { getDepartments } from "../controller/department/department.get_all.controller";
import { getDepartmentById } from "../controller/department/department.get_id.controller";
import { updateDepartment } from "../controller/department/department.update.controller";
import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/",
    // authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    createDepartment(req, res).catch(next);
  }
);

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getDepartments(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getDepartmentById(req, res).catch(next);
});

router.put(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    updateDepartment(req, res).catch(next);
  }
);

router.delete(
  "/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    deleteDepartment(req, res).catch(next);
  }
);

export default router;
