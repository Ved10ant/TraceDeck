import { Router } from "express";
import { webhooksController } from "./webhooks.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const webhooksRouter = Router();

webhooksRouter.use(requireAuth);

webhooksRouter.get("/", (req, res, next) => webhooksController.list(req, res, next));
webhooksRouter.post("/", (req, res, next) => webhooksController.create(req, res, next));
webhooksRouter.get("/:id/deliveries", (req, res, next) => webhooksController.getDeliveries(req, res, next));
