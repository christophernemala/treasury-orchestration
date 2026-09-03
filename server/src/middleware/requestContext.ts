import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Permission } from "../modules/access/policy.js";
import { ApiError } from "../shared/errors/apiError.js";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.correlationId = String(req.headers["x-correlation-id"] || randomUUID());
  res.setHeader("X-Correlation-Id", req.correlationId);
  next();
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.permissions.includes(permission)) {
      return next(new ApiError(403, "PERMISSION_DENIED", `Permission ${permission} is required.`));
    }
    next();
  };
}

export function requireIdempotencyKey(req: Request, _res: Response, next: NextFunction) {
  if (!req.headers["idempotency-key"]) {
    return next(
      new ApiError(400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key is required for this financial command."),
    );
  }
  next();
}

