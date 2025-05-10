import express, { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import colorRoutes from "./routes/colorRoute";
import sizeRoutes from "./routes/sizeRoutes";
import employeeTypeRoutes from "./routes/employeeTypeRoutes";
import mainLineProgressRoutes from "./routes/mainLineProgressRoutes";
import "module-alias/register";

import { deleteAllMainProtsess } from "./controller/mainLine/del";
import { authenticate } from "./middleware/authMiddleware";

import getFullStats from "./routes/dashboardRoute";
// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express application
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Dodo kids API" });
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/color", colorRoutes);
app.use("/api/size", sizeRoutes);
app.use("/api/employeeType", employeeTypeRoutes);
app.use("/api/mainLineProgress", mainLineProgressRoutes);

// Mount the route
app.use("/api/statistics", getFullStats);

app.post(
  "/check_token",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      res.status(200).json({ user: req.user });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }
);

app.delete("/delete", (req: Request, res: Response) => {
  deleteAllMainProtsess(req, res);
});

// Start the server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Disconnected from database");
  process.exit(0);
});
