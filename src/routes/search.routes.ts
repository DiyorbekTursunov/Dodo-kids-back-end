import express, { Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  searchInvoices,
  searchProductGroups,
} from "../controller/search/search.controller";

const router = express.Router();

// Product Pack filter route
router.get("/search", (req: Request, res: Response, next: NextFunction) => {
  searchInvoices(req, res).catch(next);
});

router.get(
  "/product-groups",
  (req: Request, res: Response, next: NextFunction) => {
    searchProductGroups(req, res).catch(next);
  }
);

export default router;
