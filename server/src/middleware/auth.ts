import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth.js";
import type { Role } from "../models.js";
import { accessForRole, type Permission } from "../modules/access/policy.js";

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: Role; email: string; permissions: Permission[]; legalEntityIds: string[] };
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/, "");
    if (!token)
      return res.status(401).json({ error: "Authentication required" });
    const claims = verifyToken(token);
    const fallbackAccess = accessForRole(claims.role);
    req.user = {
      ...claims,
      permissions: claims.permissions ?? fallbackAccess.permissions,
      legalEntityIds: claims.legalEntityIds ?? fallbackAccess.legalEntityIds,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return req.user?.role === "admin"
    ? next()
    : res.status(403).json({ error: "Admin role required" });
}
