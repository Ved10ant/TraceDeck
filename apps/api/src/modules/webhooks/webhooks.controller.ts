import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { webhookService } from "./webhooks.service";
import { z } from "zod";

const createWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export class WebhooksController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const webhooks = await webhookService.listWebhooks(req.user!.organizationId);
      res.status(200).json({ success: true, data: webhooks, error: null });
    } catch (err) { next(err); }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { url } = createWebhookSchema.parse(req.body);
      const webhook = await webhookService.createWebhook(req.user!.organizationId, url);
      // Return 201 — secret shown ONLY once at creation
      res.status(201).json({ success: true, data: webhook, error: null });
    } catch (err) { next(err); }
  }

  async getDeliveries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deliveries = await webhookService.getWebhookDeliveries(
        req.user!.organizationId, req.params.id
      );
      res.status(200).json({ success: true, data: deliveries, error: null });
    } catch (err) { next(err); }
  }
}

export const webhooksController = new WebhooksController();
