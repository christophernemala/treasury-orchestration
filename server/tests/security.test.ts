import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { store } from '../src/store/memoryStore.js';
import { platformRepository } from '../src/modules/platform/memoryRepository.js';
import { startLogin, verifyOtp } from '../src/services/auth.js';

async function login(email = 'admin@treasury.local') {
  const challenge = await startLogin(email, 'Treasury123!');
  return verifyOtp(challenge!.challengeId, challenge!.devOtp!)!.token;
}

describe('security regression evidence', () => {
  beforeEach(() => { store.reset(); platformRepository.reset(); });
  afterEach(() => vi.unstubAllEnvs());

  it('does not verify an existing development challenge in production with the fallback OTP', async () => {
    const challenge = await startLogin('admin@treasury.local', 'Treasury123!');
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => verifyOtp(challenge!.challengeId, '246810')).toThrow();
  });

  it('requires an explicit strong signing secret outside development', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', '');
    expect(() => createApp()).toThrow(/AUTH_SECRET/);
  });

  it('denies arbitrary browser origins before processing a request', async () => {
    const response = await request(createApp()).post('/api/auth/signup').set('Origin', 'https://attacker.example').send({name:'Attacker', email:'attack@example.com', password:'password123!'});
    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(store.state.users.some(user => user.email === 'attack@example.com')).toBe(false);
  });

  it('does not grant memberships to a self-registered account', async () => {
    const app = createApp();
    await request(app).post('/api/auth/signup').send({name:'Unassigned', email:'unassigned@example.com', password:'Treasury123!'}).expect(201);
    const token = await login('unassigned@example.com');
    for (const path of ['/api/dashboard', '/api/transactions', '/api/ledger', '/api/audit', '/api/reports/transactions.csv', '/api/v1/customers', '/api/treasury/live-stream']) {
      const response = await request(app).get(path).set('Authorization', `Bearer ${token}`).timeout(1000);
      expect(response.status, path).toBe(403);
    }
  });

  it('revokes existing tokens when a user is removed', async () => {
    const token = await login();
    store.state.users = store.state.users.filter(user => user.id !== 'usr-admin');
    await request(createApp()).get('/api/v1/customers').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('rejects cross-entity customer references on invoice creation', async () => {
    const token = await login();
    const before = platformRepository.state.invoices.length;
    await request(createApp()).post('/api/v1/invoices').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'cross-entity')
      .send({entityId:'le-northstar-ae', customerId:'cus-atlas', issueDate:'2026-09-09', dueDate:'2026-10-09', currency:'AED', total:'100.00'}).expect(403);
    expect(platformRepository.state.invoices).toHaveLength(before);
  });

  it('does not replay another entity response for the same idempotency key', async () => {
    const token = await login();
    const app = createApp();
    const body = {legalEntityId:'le-northstar-ae', code:'CUS-SEC', legalName:'Security test', taxId:'SEC-1234', terms:'Net 30', owner:'Owner'};
    await request(app).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'same-key').send(body).expect(201);
    const second = await request(app).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'same-key').send({...body, legalEntityId:'le-northstar-difc'}).expect(201);
    expect(second.body.legalEntityId).toBe('le-northstar-difc');
  });
});
