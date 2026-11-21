import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "tracedeck-api",
    timestamp: new Date().toISOString(),
  });
});

// Versioned API routes
app.use("/api/v1/auth", authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);
