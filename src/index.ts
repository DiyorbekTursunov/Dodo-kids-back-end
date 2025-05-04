import express, { Request, Response } from "express";
import Auth from "./routes/auth.routes";
import { setupSwagger } from "./lib/swagger";
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.json({ status: res.statusCode, message: "Server is running" });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/", Auth);

setupSwagger(app);

app.listen(PORT, () => {
  console.log(`⚡️ Server running at http://localhost:${PORT}/`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});
