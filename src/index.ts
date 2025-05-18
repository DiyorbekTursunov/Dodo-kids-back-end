import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import "module-alias/register";

import authRoutes from "./routes/auth.routes";
import departmentRoutes from "./routes/department.routes";
import colorRoutes from "./routes/color.routes";
import sizeRoutes from "./routes/size.routes";
import productRoutes from "./routes/product.routes";
// import productPackRoutes from "./routes/product_pack.routes";
// import dashboardRoutes from "./routes/dashboard.routes";
import employeeRoutes from "./routes/employee.routes";
// import filterRouters from "./routes/filters.routes";
// import searchRouters from "./routes/search.routes";

dotenv.config();

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
app.use("/api/department", departmentRoutes);
app.use("/api/color", colorRoutes);
app.use("/api/size", sizeRoutes);
app.use("/api/product", productRoutes);
// app.use("/api/product_pack", productPackRoutes);
// app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
// app.use("/api/models", filterRouters);
// app.use("/api/models", searchRouters);

// app.post(
//   "/check_token",
//   authenticate,
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       if (!req.user) {
//         res.status(401).json({ message: "Unauthorized" });
//         return;
//       }

//       res.status(200).json({ user: req.user });
//     } catch (error) {
//       res.status(500).json({
//         message: "Internal Server Error",
//         error: (error as Error).message,
//       });
//     }
//   }
// );

// Start the server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
