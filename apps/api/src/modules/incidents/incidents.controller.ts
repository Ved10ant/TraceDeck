import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { incidentService } from "./incidents.service";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]),
  message: z.string().min(1, "A message is required when updating incident status"),
});

export class IncidentsController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const statusFilter = req.query.status as string | undefined;

      const incidents = await incidentService.listIncidents(organizationId, statusFilter);

      res.status(200).json({ success: true, data: incidents, error: null });
    } catch (err) { next(err); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const incident = await incidentService.getIncidentById(organizationId, req.params.id);

      res.status(200).json({ success: true, data: incident, error: null });
    } catch (err) { next(err); }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { status, message } = updateStatusSchema.parse(req.body);

      const updated = await incidentService.updateIncidentStatus(
        organizationId, req.params.id, status as any, message
      );

      res.status(200).json({ success: true, data: updated, error: null });
    } catch (err) { next(err); }
  }
}

export const incidentsController = new IncidentsController();
