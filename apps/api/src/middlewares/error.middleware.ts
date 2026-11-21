import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
  }

  // Handle known operational errors
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message || "An error occurred";

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
