import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { store } from '../src/store/memoryStore.js';
import { platformRepository } from '../src/modules/platform/memoryRepository.js';
import { startLogin, verifyOtp } from '../src/services/auth.js';
import { broadcastTreasurySnapshot } from '../src/routes/treasuryStream.js';
import { runtimeConfig } from '../src/config.js';

async function login(email = 'admin@treasury.local') {
  const challenge = await startLogin(email, 'Treasury123!');
  return verifyOtp(challenge!.challengeId, challenge!.devOtp!)!.token;
}

const legacyReads = ['/api/dashboard', '/api/transactions', '/api/unapplied-cash', '/api/ledger', '/api/statements', '/api/audit', '/api/reports/transactions.csv', '/api/reconciliation/suggestions/tx-001', '/api/treasury/live-stream'];

describe('tenant and entity authorization', () => {
  beforeEach(() => { store.reset(); platformRepository.reset(); });
  afterEach(() => vi.unstubAllEnvs());

  it('filters every v1 collection for a single-entity member and denies foreign details', async () => {
    store.state.memberships[0].legalEntityIds = ['le-northstar-ae'];
    const token = await login();
    const app = createApp();
    for (const path of ['legal-entities', 'customers', 'invoices', 'bank-accounts', 'payments', 'escrow/accounts', 'approvals', 'audit-events']) {
      const response = await request(app).get(`/api/v1/${path}`).set('Authorization', `Bearer ${token}`).expect(200);
      expect(JSON.stringify(response.body), path).not.toContain('le-northstar-difc');
    }
    for (const path of ['customers/cus-atlas', 'invoices/inv-24096', 'payments/pay-atlas-4402', 'payments/pay-atlas-4402/tracking']) {
      await request(app).get(`/api/v1/${path}`).set('Authorization', `Bearer ${token}`).expect(403);
    }
    for (const path of legacyReads) await request(app).get(path).set('Authorization', `Bearer ${token}`).timeout(1000).expect(403);
  });

  it('denies legacy mutations and global resets to partial-scope members', async () => {
    store.state.memberships[0].legalEntityIds = ['le-northstar-ae'];
    const token = await login();
    const app = createApp();
    const before = JSON.stringify(store.state);
    for (const path of ['/api/transactions', '/api/unapplied-cash', '/api/reconciliation/tx-001', '/api/seed', '/api/v1/dev/reset']) {
      await request(app).post(path).set('Authorization', `Bearer ${token}`).send({}).expect(403);
    }
    await request(app).patch('/api/transactions/tx-001').set('Authorization', `Bearer ${token}`).send({amount:1}).expect(403);
    await request(app).patch('/api/unapplied-cash/ua-001').set('Authorization', `Bearer ${token}`).send({amount:1}).expect(403);
    await request(app).delete('/api/transactions/tx-001').set('Authorization', `Bearer ${token}`).expect(403);
    expect(JSON.stringify(store.state)).toBe(before);
  });

  it('cannot use another tenant entity even if it appears in a membership grant', async () => {
    platformRepository.state.legalEntities.push({...platformRepository.state.legalEntities[0], id:'entity-b', tenantId:'tenant-b'});
    store.state.memberships[0] = {...store.state.memberships[0], tenantId:'tenant-b', legalEntityIds:['entity-b','le-northstar-ae','le-northstar-difc']};
    const token = await login();
    const app = createApp();
    for (const path of ['customers', 'invoices', 'payments', 'bank-accounts', 'approvals', 'audit-events']) {
      const response = await request(app).get(`/api/v1/${path}`).set('Authorization', `Bearer ${token}`).expect(200);
      expect(response.body).toEqual([]);
    }
    for (const path of legacyReads) await request(app).get(path).set('Authorization', `Bearer ${token}`).timeout(1000).expect(403);
    await request(app).post('/api/v1/invoices').set('Authorization', `Bearer ${token}`).set('Idempotency-Key','tenant-b-write')
      .send({entityId:'le-northstar-ae', customerId:'cus-gulf-retail', issueDate:'2026-09-09', dueDate:'2026-10-09', currency:'AED', total:'1.00'}).expect(403);
    await request(app).post('/api/v1/dev/reset').set('Authorization', `Bearer ${token}`).expect(403);
  });

  it('rechecks role, membership activity and disabled status on existing tokens', async () => {
    const token = await login();
    const app = createApp();
    store.state.memberships[0].role = 'treasury';
    await request(app).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).send({}).expect(403);
    store.state.memberships[0].active = false;
    await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${token}`).expect(403);
    store.state.users[0].disabled = true;
    await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('cannot reset another tenant or remove identities through a demo reset', async () => {
    platformRepository.state.legalEntities.push({...platformRepository.state.legalEntities[0], id:'entity-b', tenantId:'tenant-b'});
    store.state.users.push({...store.state.users[0], id:'user-b', email:'b@example.com'});
    const token = await login();
    const app = createApp();
    const before = JSON.stringify(platformRepository.state);
    await request(app).post('/api/v1/dev/reset').set('Authorization', `Bearer ${token}`).expect(409);
    expect(JSON.stringify(platformRepository.state)).toBe(before);
    await request(app).post('/api/seed').set('Authorization', `Bearer ${token}`).expect(200);
    expect(store.state.users.some(user => user.id === 'user-b')).toBe(true);
  });

  it('rechecks entity scope before an idempotency replay and rejects payload reuse', async () => {
    const token = await login();
    const app = createApp();
    const body = {legalEntityId:'le-northstar-ae', code:'CUS-CACHE', legalName:'Cache test', taxId:'CACHE-1234', terms:'Net 30', owner:'Owner'};
    await request(app).post('/api/v1/customers').set('Authorization',`Bearer ${token}`).set('Idempotency-Key','revoked-cache').send(body).expect(201);
    await request(app).post('/api/v1/customers').set('Authorization',`Bearer ${token}`).set('Idempotency-Key','revoked-cache').send({...body,legalName:'Changed'}).expect(409);
    store.state.memberships[0].legalEntityIds = ['le-northstar-difc'];
    await request(app).post('/api/v1/customers').set('Authorization',`Bearer ${token}`).set('Idempotency-Key','revoked-cache').send(body).expect(403);
  });

  it('does not trust role or entity claims in a correctly signed token', async () => {
    const token = jwt.sign({sub:'usr-treasury', tenantId:'tenant-northstar', role:'admin', permissions:['admin.manage'], legalEntityIds:['le-northstar-ae','le-northstar-difc']}, runtimeConfig().secret,
      {issuer:'treasury-local', audience:'treasury-api', expiresIn:'1m'});
    await request(createApp()).post('/api/seed').set('Authorization', `Bearer ${token}`).expect(403);
  });

  it('exercises TAT-UAT-016 and TAT-UAT-017 against real API authorization', async () => {
    const token = await login('analyst@treasury.local');
    const app = createApp();
    const before = JSON.stringify(platformRepository.state);
    for (const path of ['/api/v1/invoices/inv-24081/close', '/api/v1/escrow/releases', '/api/v1/approvals/apr-inv-close/decisions']) {
      await request(app).post(path).set('Authorization', `Bearer ${token}`).set('Idempotency-Key','unauthorized-uat').send({decision:'approved', accountId:'esc-kriba-aed', amount:'1.00'}).expect(403);
    }
    await request(app).post('/api/v1/payments/pay-gr-88912/release').set('Authorization', `Bearer ${token}`).send({}).expect(404);
    expect(JSON.stringify(platformRepository.state)).toBe(before);
  });
});

describe('SSE session lifetime', () => {
  beforeEach(() => { store.reset(); platformRepository.reset(); });

  it('rejects anonymous, query-string, malformed and expired credentials', async () => {
    const token = await login();
    const app = createApp();
    await request(app).get('/api/treasury/live-stream').expect(401);
    await request(app).get(`/api/treasury/live-stream?token=${token}`).expect(401);
    await request(app).get('/api/treasury/live-stream').set('Authorization',token).expect(401);
    const expired = jwt.sign({sub:'usr-admin',tenantId:'tenant-northstar'},runtimeConfig().secret,{issuer:'treasury-local',audience:'treasury-api',expiresIn:-1});
    await request(app).get('/api/treasury/live-stream').set('Authorization',`Bearer ${expired}`).expect(401);
  });

  it.each(['membership', 'scope', 'disabled', 'expiry'] as const)('closes an established stream on %s before sending further data', async reason => {
    const token = reason === 'expiry'
      ? jwt.sign({sub:'usr-admin',tenantId:'tenant-northstar'},runtimeConfig().secret,{issuer:'treasury-local',audience:'treasury-api',expiresIn:2})
      : await login();
    const server = createApp().listen(0, '127.0.0.1');
    await once(server, 'listening');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/treasury/live-stream`, {headers:{Authorization:`Bearer ${token}`},signal:controller.signal});
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let initial = '';
      while (!initial.includes('dataMode')) initial += decoder.decode((await reader.read()).value);
      expect(initial).toContain('treasury.snapshot');
      if (reason === 'membership') store.state.memberships[0].active = false;
      if (reason === 'scope') store.state.memberships[0].legalEntityIds = ['le-northstar-ae'];
      if (reason === 'disabled') store.state.users[0].disabled = true;
      if (reason !== 'expiry') broadcastTreasurySnapshot();
      const next = await reader.read();
      expect(next.done).toBe(true);
      // A disconnected/revoked client must also be safe to broadcast past.
      broadcastTreasurySnapshot();
    } finally {
      clearTimeout(timeout);
      controller.abort();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
