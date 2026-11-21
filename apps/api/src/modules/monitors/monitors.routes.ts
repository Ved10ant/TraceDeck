import { Router } from "express";
import { monitorsController } from "./monitors.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const monitorsRouter = Router();

// All monitor routes require authentication
monitorsRouter.use(requireAuth);

monitorsRouter.post("/", (req, res, next) => monitorsController.create(req, res, next));
monitorsRouter.get("/", (req, res, next) => monitorsController.list(req, res, next));
monitorsRouter.get("/:id", (req, res, next) => monitorsController.getById(req, res, next));
monitorsRouter.patch("/:id", (req, res, next) => monitorsController.update(req, res, next));
monitorsRouter.delete("/:id", (req, res, next) => monitorsController.delete(req, res, next));
monitorsRouter.post("/:id/test", (req, res, next) => monitorsController.test(req, res, next));
