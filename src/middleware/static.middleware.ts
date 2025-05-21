import express from "express";
import path from "path";

// This middleware serves the uploaded files
export const staticFilesMiddleware = express.static(
  path.join(__dirname, "../uploads")
);

// This middleware handles sending specific files
export const serveFile = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, "../uploads", filename), (err) => {
    if (err) {
      next(err);
    }
  });
};
