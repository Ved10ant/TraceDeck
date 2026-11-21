import { Request, Response, NextFunction } from "express";
import { authService, AuthTokenPayload } from "../modules/auth/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization token",
      },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_TOKEN",
        message: "Token has expired or is invalid",
      },
    });
  }
}
