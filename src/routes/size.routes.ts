import { getSizeById } from "../controller/size/size.by_id.controller";
import { createSize } from "../controller/size/size.create.controller";
import { deleteSize } from "../controller/size/size.delete.controller";
import { getSizes } from "../controller/size/size.get_all.controller";
import { updateSize } from "../controller/size/size.update.controller";
import { Router, Request, Response, NextFunction } from "express";

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  createSize(req, res).catch(next);
});

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  getSizes(req, res).catch(next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  getSizeById(req, res).catch(next);
});

router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  updateSize(req, res).catch(next);
});

router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  deleteSize(req, res).catch(next);
});

export default router;
