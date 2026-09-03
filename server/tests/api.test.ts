import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { store } from '../src/store/memoryStore.js';

async function token(){const app=createApp();const login=await request(app).post('/api/auth/login').send({email:'admin@treasury.demo',password:'Treasury123!'});const verify=await request(app).post('/api/auth/verify-otp').send({challengeId:login.body.challengeId,otp:login.body.devOtp});return {app,value:verify.body.token}}
describe('treasury API',()=>{
  beforeEach(()=>store.reset());
  it('requires authentication for dashboard data',async()=>expect((await request(createApp()).get('/api/dashboard')).status).toBe(401));
  it('returns labeled mock dashboard data after OTP',async()=>{const x=await token();const res=await request(x.app).get('/api/dashboard').set('Authorization',`Bearer ${x.value}`);expect(res.status).toBe(200);expect(res.body.dataMode).toBe('mock-development');expect(res.body.reconciliation.total).toBe(7)});
  it('records a human reconciliation decision',async()=>{const x=await token();const res=await request(x.app).post('/api/reconciliation/tx-001').set('Authorization',`Bearer ${x.value}`).send({decision:'matched',journalId:'jr-001',note:'Reviewed'});expect(res.status).toBe(200);expect(res.body.status).toBe('matched');expect(store.state.audit[0].action).toBe('reconciliation.matched')});
  it('supports transaction creation and admin deletion',async()=>{const x=await token();const created=await request(x.app).post('/api/transactions').set('Authorization',`Bearer ${x.value}`).send({date:'2026-08-31',valueDate:'2026-08-31',description:'Test transfer',amount:100,currency:'AED',account:'Test'});expect(created.status).toBe(201);const removed=await request(x.app).delete(`/api/transactions/${created.body.id}`).set('Authorization',`Bearer ${x.value}`);expect(removed.status).toBe(204)});
});
