import { Router } from "express";
import { incidentsController } from "./incidents.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const incidentsRouter = Router();

incidentsRouter.use(requireAuth);

incidentsRouter.get("/", (req, res, next) => incidentsController.list(req, res, next));
incidentsRouter.get("/:id", (req, res, next) => incidentsController.getById(req, res, next));
incidentsRouter.patch("/:id", (req, res, next) => incidentsController.updateStatus(req, res, next));
