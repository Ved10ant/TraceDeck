import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createMonitorSchema,
  updateMonitorSchema,
  listMonitorsQuerySchema,
} from "./monitors.schemas";
import { monitorsService } from "./monitors.service";

export class MonitorsController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const validated = createMonitorSchema.parse(req.body);

      const monitor = await monitorsService.createMonitor(organizationId, validated);

      res.status(201).json({
        success: true,
        data: monitor,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const query = listMonitorsQuerySchema.parse(req.query);

      const result = await monitorsService.listMonitors(organizationId, query);

      res.status(200).json({
        success: true,
        data: result.monitors,
        pagination: result.pagination,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const monitorId = req.params.id;

      const monitor = await monitorsService.getMonitorById(organizationId, monitorId);

      res.status(200).json({
        success: true,
        data: monitor,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const monitorId = req.params.id;
      const validated = updateMonitorSchema.parse(req.body);

      const updated = await monitorsService.updateMonitor(organizationId, monitorId, validated);

      res.status(200).json({
        success: true,
        data: updated,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const monitorId = req.params.id;

      const result = await monitorsService.deleteMonitor(organizationId, monitorId);

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async test(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const monitorId = req.params.id;

      const result = await monitorsService.triggerManualCheck(organizationId, monitorId);

      // Return 202 Accepted for asynchronous task handoff
      res.status(202).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const monitorsController = new MonitorsController();
