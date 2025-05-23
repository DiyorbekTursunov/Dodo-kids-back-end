import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import "module-alias/register";
import path from "path";

import authRoutes from "./routes/auth.routes";
import departmentRoutes from "./routes/department.routes";
import colorRoutes from "./routes/color.routes";
import sizeRoutes from "./routes/size.routes";
import productRoutes from "./routes/product.routes";
import productPackRoutes from "./routes/product_pack.routes";
import employeeRoutes from "./routes/employee.routes";
import fileRoutes from "./routes/file.routes"; // Add this line
import { staticFilesMiddleware, serveFile } from "./middleware/static.middleware"; // Add this line
import dashboardRoutes from "./routes/dashboard.routes";
import filterRouters from "./routes/filters.routes";
import searchRouters from "./routes/search.routes";

dotenv.config();

// Create Express application
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use("/uploads", staticFilesMiddleware);
app.get("/uploads/:filename", serveFile);

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
app.use("/api/department", departmentRoutes);
app.use("/api/color", colorRoutes);
app.use("/api/size", sizeRoutes);
app.use("/api/product", productRoutes);
app.use("/api/product_pack", productPackRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/files", fileRoutes); // Add this line
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/models", filterRouters);
// app.use("/api/models", searchRouters);

// Error handler
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
