import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "./auth.schemas";
import { authService } from "./auth.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated);

      res.status(201).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);

      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          data: null,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
      }

      const user = await authService.getCurrentUser(req.user.userId);
      res.status(200).json({
        success: true,
        data: user,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
