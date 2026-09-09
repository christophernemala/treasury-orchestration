import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.js';
import { ApiError } from '../shared/errors/apiError.js';

declare global {
  namespace Express {
    interface Request { user?: ReturnType<typeof verifyToken>; }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    if (!match) return res.status(401).json({ error: 'Authentication required' });
    req.user = verifyToken(match[1]);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireMembership(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.tenantId || !req.user.legalEntityIds.length) return next(new ApiError(403, 'MEMBERSHIP_REQUIRED', 'An active legal-entity membership is required.'));
  next();
}

// The legacy dataset has no per-record ownership. Never expose any of it to
// partial-scope users; v1 resources support individual entity filtering.
export function legacyScopeAllowed(user: ReturnType<typeof verifyToken>) {
  return user.tenantId === 'tenant-northstar' &&
    ['le-northstar-ae', 'le-northstar-difc'].every(id => user.legalEntityIds.includes(id));
}

export function requireLegacyScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || !legacyScopeAllowed(req.user)) return next(new ApiError(403, 'ENTITY_SCOPE_DENIED', 'The legacy workspace requires access to its full legal-entity scope.'));
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return req.user?.permissions.includes('admin.manage') ? next() : res.status(403).json({ error: 'Admin permission required' });
}
