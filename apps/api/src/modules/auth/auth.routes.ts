import { Router } from "express";
import { authController } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", (req, res, next) => authController.register(req, res, next));
authRouter.post("/login", (req, res, next) => authController.login(req, res, next));
authRouter.get("/me", requireAuth, (req, res, next) => authController.me(req, res, next));
