import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../store/memoryStore.js';
import { accessForRole } from '../modules/access/policy.js';
import { platformRepository } from '../modules/platform/memoryRepository.js';
import { isDevelopment, runtimeConfig } from '../config.js';
import { ApiError } from '../shared/errors/apiError.js';

const challenges = new Map<string, { userId: string; tenantId?: string; expires: number; digest: Buffer; attempts: number }>();
const issuer = 'treasury-local';
const audience = 'treasury-api';

function requireLocalIdentity() {
  if (!isDevelopment()) throw new ApiError(503, 'IDENTITY_NOT_CONFIGURED', 'Production identity is not configured.');
}

export function currentAccess(userId: string, tenantId?: string) {
  const user = store.state.users.find(user => user.id === userId && !user.disabled);
  if (!user) throw new Error('User is unavailable');
  const membership = store.state.memberships.find(item => item.userId === userId && item.tenantId === tenantId && item.active);
  const legalEntityIds = membership?.legalEntityIds.filter(id => platformRepository.state.legalEntities.some(entity => entity.id === id && entity.tenantId === tenantId && entity.status === 'active')) ?? [];
  return {
    sub: user.id, email: user.email, role: membership?.role ?? 'treasury' as const,
    tenantId: membership?.tenantId,
    permissions: membership && legalEntityIds.length ? accessForRole(membership.role).permissions : [],
    legalEntityIds,
  };
}

export async function startLogin(email: string, password: string) {
  requireLocalIdentity();
  const user = store.state.users.find(user => user.email.toLowerCase() === email.toLowerCase() && !user.disabled);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  for (const [id, challenge] of challenges) if (challenge.expires <= Date.now() || challenge.userId === user.id) challenges.delete(id);
  if (challenges.size >= 1000) throw new ApiError(429, 'LOGIN_BUSY', 'Try again later.');
  const challengeId = crypto.randomUUID();
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const tenantId = store.state.memberships.find(item => item.userId === user.id && item.active)?.tenantId;
  challenges.set(challengeId, { userId: user.id, tenantId, expires: Date.now() + 5 * 60_000, digest: crypto.createHash('sha256').update(otp).digest(), attempts: 0 });
  return { challengeId, devOtp: otp };
}

export function verifyOtp(challengeId: string, otp: string) {
  requireLocalIdentity();
  const challenge = challenges.get(challengeId);
  if (!challenge) return null;
  if (challenge.expires <= Date.now() || ++challenge.attempts >= 5) challenges.delete(challengeId);
  if (challenge.expires <= Date.now() || !crypto.timingSafeEqual(challenge.digest, crypto.createHash('sha256').update(otp).digest())) return null;
  challenges.delete(challengeId);
  const user = store.state.users.find(user => user.id === challenge.userId && !user.disabled);
  if (!user) return null;
  const access = currentAccess(user.id, challenge.tenantId);
  const token = jwt.sign({ sub: user.id, tenantId: access.tenantId }, runtimeConfig().secret, { algorithm: 'HS256', expiresIn: '15m', issuer, audience });
  return { token, user: { id: user.id, name: user.name, onboarded: user.onboarded, ...access } };
}

export function verifyToken(token: string) {
  requireLocalIdentity();
  const claims = jwt.verify(token, runtimeConfig().secret, { algorithms: ['HS256'], issuer, audience });
  if (typeof claims === 'string' || typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || (claims.tenantId !== undefined && typeof claims.tenantId !== 'string')) throw new Error('Invalid claims');
  return { ...currentAccess(claims.sub, claims.tenantId), exp: claims.exp };
}
