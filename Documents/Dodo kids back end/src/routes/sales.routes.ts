import { Router, Request, Response, NextFunction } from "express";
import { getAllSales } from "../controllers/sales/sales.get.controller";
import { addAllSales } from "../controllers/sales/sales.add.controller";
import { delAllSales } from "../controllers/sales/sales.del.controller";
import { editSales } from "../controllers/sales/sales.edit.controller";
import { searchSales } from "../controllers/sales/sales.search.controller";

const router = Router();

// GET endpoint for retrieving all storage items
router.get("/sales", (req: Request, res: Response, next: NextFunction) => {
  getAllSales(req, res).catch(next);
});

// POST endpoint for adding new storage items
router.post("/sales", (req: Request, res: Response, next: NextFunction) => {
  addAllSales(req, res).catch(next);
});

// DELETE endpoint for removing storage items
router.delete("/sales", (req: Request, res: Response, next: NextFunction) => {
  delAllSales(req, res).catch(next);
});

// PUT endpoint for editing storage items
router.put("/sales", (req: Request, res: Response, next: NextFunction) => {
  editSales(req, res).catch(next);
});

// GET endpoint for searching storage items
router.get(
  "/sales/search",
  (req: Request, res: Response, next: NextFunction) => {
    searchSales(req, res).catch(next);
  }
);

export default router;


