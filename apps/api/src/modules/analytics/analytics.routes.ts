import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const analyticsRouter = Router();

// All analytics routes require authentication
analyticsRouter.use(requireAuth);

analyticsRouter.get("/overview", (req, res, next) => analyticsController.getOverview(req, res, next));
analyticsRouter.get("/monitors/:id", (req, res, next) => analyticsController.getMonitorAnalytics(req, res, next));
