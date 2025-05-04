import { Router, Request, Response, NextFunction } from "express";
import { getAllStorage } from "../controllers/storage/storage.get.controller";
import { addAllStorage } from "../controllers/storage/storage.add.controller";
import { deleteStorage } from "../controllers/storage/storage.del.controller";
import { editStorage } from "../controllers/storage/storage.edit.controller";
import { searchStorage } from "../controllers/storage/storage.search.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/storage:
 *   get:
 *     summary: Retrieve all storage items for the authenticated user
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of storage items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   company:
 *                     type: string
 *                   model:
 *                     type: string
 *                   condition:
 *                     type: string
 *                   imei:
 *                     type: string
 *                   purchaseId:
 *                     type: string
 *                   purchasePrice:
 *                     type: number
 *                   purchaseDate:
 *                     type: string
 *                   status:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/storage:
 *   post:
 *     summary: Add new storage items for the authenticated user
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *               model:
 *                 type: string
 *               condition:
 *                 type: string
 *               imei:
 *                 type: string
 *               purchaseId:
 *                 type: string
 *               purchasePrice:
 *                 type: number
 *               purchaseDate:
 *                 type: string
 *               status:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Storage item successfully added
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */

/**
 * @swagger
 * /api/storage:
 *   delete:
 *     summary: Remove a storage item for the authenticated user
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Storage item successfully deleted
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */

/**
 * @swagger
 * /api/storage:
 *   put:
 *     summary: Edit a storage item for the authenticated user
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               company:
 *                 type: string
 *               model:
 *                 type: string
 *               condition:
 *                 type: string
 *               imei:
 *                 type: string
 *               purchaseId:
 *                 type: string
 *               purchasePrice:
 *                 type: number
 *               purchaseDate:
 *                 type: string
 *               status:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Storage item successfully edited
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */

/**
 * @swagger
 * /api/storage/search:
 *   get:
 *     summary: Search storage items for the authenticated user
 *     tags:
 *       - Storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Search query to filter storage items
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of storage items matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   company:
 *                     type: string
 *                   model:
 *                     type: string
 *                   condition:
 *                     type: string
 *                   imei:
 *                     type: string
 *                   purchaseId:
 *                     type: string
 *                   purchasePrice:
 *                     type: number
 *                   purchaseDate:
 *                     type: string
 *                   status:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */

router.get("/storage", (req: Request, res: Response, next: NextFunction) => {
    getAllStorage(req, res).catch(next);
});

// POST endpoint for adding new storage items
router.post("/storage", (req: Request, res: Response, next: NextFunction) => {
    addAllStorage(req, res).catch(next);
});

// DELETE endpoint for removing storage items
router.delete("/storage", (req: Request, res: Response, next: NextFunction) => {
    deleteStorage(req, res).catch(next);
});

// PUT endpoint for editing storage items
router.put("/storage", (req: Request, res: Response, next: NextFunction) => {
    editStorage(req, res).catch(next);
});

// GET endpoint for searching storage items
router.get(
    "/storage/search",
    (req: Request, res: Response, next: NextFunction) => {
        searchStorage(req, res).catch(next);
    }
);

export default router;
