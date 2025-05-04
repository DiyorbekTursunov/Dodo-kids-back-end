import express, { Request, Response, NextFunction } from "express";
import { register } from "../controllers/auth/auth.register.controller";
import { login } from "../controllers/auth/auth.login.controller";

const router = express.Router();

// Register route
/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 description: The username of the user
 *                 example: diyorbek
 *               password:
 *                 type: string
 *                 description: The password of the user
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   description: JWT token for the registered user
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The ID of the user
 *                     name:
 *                       type: string
 *                       description: The username of the user
 *       400:
 *         description: Bad request (e.g., missing fields or user already exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username and password are required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/register", (req: Request, res: Response, next: NextFunction) => {
  register(req, res).catch(next); // catch errors and forward to error handler
});

// Login route
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 description: The username of the user
 *                 example: diyorbek
 *               password:
 *                 type: string
 *                 description: The password of the user
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for the logged-in user
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The ID of the user
 *                     name:
 *                       type: string
 *                       description: The username of the user
 *       400:
 *         description: Bad request (e.g., missing fields or invalid credentials)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  login(req, res).catch(next); // catch errors and forward to error handler
});

export default router;
