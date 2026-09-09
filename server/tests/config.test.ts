import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runtimeConfig } from '../src/config.js';
import { startLogin, verifyOtp, verifyToken } from '../src/services/auth.js';
import { MemoryStore, store } from '../src/store/memoryStore.js';

describe('production configuration boundary', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_SECRET', '0123456789abcdef'.repeat(4));
    vi.stubEnv('CLIENT_ORIGIN', 'https://treasury.example.com,https://review.example.com');
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('DEV_OTP', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(['production', 'staging', ''])('fails closed in environment %s without using development routes or data', async environment => {
    vi.stubEnv('NODE_ENV', environment);
    const app = createApp();
    const productionStore = new MemoryStore();
    expect(productionStore.state.users).toEqual([]);
    expect(productionStore.state.transactions).toEqual([]);
    expect(() => productionStore.reset()).toThrow(/disabled/);
    const before = JSON.stringify(store.state);
    await request(app).get('/api/health').expect(200);
    const readiness = await request(app).get('/api/health/runtime').expect(503);
    expect(readiness.body.canMutate).toBe(false);
    for (const path of ['/api/auth/signup','/api/seed','/api/v1/dev/reset']) await request(app).post(path).send({}).expect(404);
    for (const path of ['/api/auth/login','/api/auth/verify-otp']) await request(app).post(path).send({otp:'246810'}).expect(503);
    for (const path of ['/api/dashboard','/api/transactions','/api/v1/customers','/api/treasury/live-stream']) await request(app).get(path).expect(503);
    await expect(startLogin('admin@treasury.local','Treasury123!')).rejects.toThrow(/identity/);
    expect(() => verifyOtp('anything','246810')).toThrow(/identity/);
    expect(JSON.stringify(store.state)).toBe(before);
  });

  it.each(['', 'short', 'replace-with-a-long-random-secret', ' '.repeat(32), 'a'.repeat(64)])('rejects missing, weak or placeholder AUTH_SECRET: %s', secret => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('AUTH_SECRET',secret);
    expect(() => runtimeConfig()).toThrow(/AUTH_SECRET/);
  });

  it('rejects the old signing variable and fixed production OTP configuration', () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('JWT_SECRET','legacy');
    expect(() => runtimeConfig()).toThrow(/JWT_SECRET/);
    vi.stubEnv('JWT_SECRET',''); vi.stubEnv('DEV_OTP','123456');
    expect(() => runtimeConfig()).toThrow(/DEV_OTP/);
  });

  it.each(['', '*', 'null', 'https://*.example.com', 'https://treasury.example.com/path', 'http://treasury.example.com', 'https://user:password@treasury.example.com', 'https://localhost'])('rejects invalid production browser origin %s', origin => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('CLIENT_ORIGIN',origin);
    expect(() => createApp()).toThrow(/CLIENT_ORIGIN/);
  });

  it('allows exact listed origins and denies suffix attacks, null and unlisted origins including preflights', async () => {
    const app = createApp();
    for (const origin of ['https://treasury.example.com','https://review.example.com']) {
      const response = await request(app).options('/api/auth/login').set('Origin',origin).set('Access-Control-Request-Method','POST').expect(204);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers.vary).toContain('Origin');
    }
    for (const origin of ['https://treasury.example.com.attacker.test','null','https://unlisted.example.com']) {
      const response = await request(app).options('/api/auth/login').set('Origin',origin).set('Access-Control-Request-Method','POST').expect(403);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    }
  });

  it('uses AUTH_SECRET consistently across app instances and rejects a changed key', async () => {
    const challenge = await startLogin('admin@treasury.local','Treasury123!');
    const token = verifyOtp(challenge!.challengeId,challenge!.devOtp)!.token;
    await request(createApp()).get('/api/me').set('Authorization',`Bearer ${token}`).expect(200);
    await request(createApp()).get('/api/me').set('Authorization',`Bearer ${token}`).expect(200);
    vi.stubEnv('AUTH_SECRET','fedcba9876543210'.repeat(4));
    expect(() => verifyToken(token)).toThrow();
  });

  it('consumes OTPs once and locks a challenge after five wrong attempts', async () => {
    const challenge = (await startLogin('admin@treasury.local','Treasury123!'))!;
    const wrong = challenge.devOtp === '000000' ? '999999' : '000000';
    for (let attempt = 0; attempt < 5; attempt++) expect(verifyOtp(challenge.challengeId,wrong)).toBeNull();
    expect(verifyOtp(challenge.challengeId,challenge.devOtp)).toBeNull();
    const second = (await startLogin('admin@treasury.local','Treasury123!'))!;
    expect(verifyOtp(second.challengeId,second.devOtp)?.token).toBeTruthy();
    expect(verifyOtp(second.challengeId,second.devOtp)).toBeNull();
  });
});
