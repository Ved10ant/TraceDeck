import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { analyticsService } from "./analytics.service";

export class AnalyticsController {
  async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const windowStr = (req.query.window as string) || "24h";

      const overview = await analyticsService.getOverview(organizationId, windowStr);

      res.status(200).json({
        success: true,
        data: overview,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMonitorAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const monitorId = req.params.id;
      const windowStr = (req.query.window as string) || "24h";

      const result = await analyticsService.getMonitorAnalytics(organizationId, monitorId, windowStr);

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
