import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes";
import { monitorsRouter } from "./modules/monitors/monitors.routes";
import { incidentsRouter } from "./modules/incidents/incidents.routes";
import { webhooksRouter } from "./modules/webhooks/webhooks.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
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
app.use("/api/v1/monitors", monitorsRouter);
app.use("/api/v1/incidents", incidentsRouter);
app.use("/api/v1/webhooks", webhooksRouter);
app.use("/api/v1/analytics", analyticsRouter);

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
