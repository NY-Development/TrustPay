import request from 'supertest';
import { app, registerOwner } from './helpers';

const createBranchPayload = (overrides: Partial<Record<string, any>> = {}) => ({
  branchName: 'Second Branch',
  region: 'Addis Ababa',
  city: 'Addis Ababa',
  address: '456 Test Ave',
  phone: '0911000001',
  email: `branch-${Date.now()}-${Math.random().toString(36).slice(2)}@test.trustpay.dev`,
  ...overrides,
});

describe('POST /branches', () => {
  it('creates a new branch for the owner', async () => {
    const { agent, csrfToken } = await registerOwner();

    const res = await agent
      .post('/api/v1/branches')
      .set('X-CSRF-Token', csrfToken!)
      .send(createBranchPayload());

    expect(res.status).toBe(201);
    expect(res.body.data.branchName).toBe('Second Branch');
    expect(res.body.data.branchCode).toBeDefined();
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/v1/branches').send(createBranchPayload());
    expect(res.status).toBe(401);
  });
});

describe('GET /branches', () => {
  it('lists only the owner\'s own branches (initial + created)', async () => {
    const { agent, csrfToken } = await registerOwner();
    await agent.post('/api/v1/branches').set('X-CSRF-Token', csrfToken!).send(createBranchPayload());

    const res = await agent.get('/api/v1/branches');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('PUT /branches/:id', () => {
  it('updates branch details', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();

    const res = await agent
      .put(`/api/v1/branches/${branchId}`)
      .set('X-CSRF-Token', csrfToken!)
      .send({ branchName: 'Renamed Branch', phone: '0911999999' });

    expect(res.status).toBe(200);
    expect(res.body.data.branchName).toBe('Renamed Branch');
    expect(res.body.data.phone).toBe('0911999999');
  });

  it('rejects updating a branch owned by someone else', async () => {
    const { agent: ownerA, csrfToken: csrfA } = await registerOwner();
    const { branchId: branchB } = await registerOwner();

    const res = await ownerA
      .put(`/api/v1/branches/${branchB}`)
      .set('X-CSRF-Token', csrfA!)
      .send({ branchName: 'Hijacked' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /branches/:id/deactivate', () => {
  it('deactivates a branch', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();

    const res = await agent
      .put(`/api/v1/branches/${branchId}/deactivate`)
      .set('X-CSRF-Token', csrfToken!);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });
});

describe('branch settlement accounts', () => {
  it('adds and then removes a settlement account', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();

    const addRes = await agent
      .post(`/api/v1/branches/${branchId}/accounts`)
      .set('X-CSRF-Token', csrfToken!)
      .send({ accountNumber: '9999999999', accountProvider: 'telebirr' });

    expect(addRes.status).toBe(200);
    const account = addRes.body.data.find((a: any) => a.accountNumber === '9999999999');
    expect(account).toBeDefined();

    const removeRes = await agent
      .delete(`/api/v1/branches/${branchId}/accounts/${account._id}`)
      .set('X-CSRF-Token', csrfToken!);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.find((a: any) => a.accountNumber === '9999999999')).toBeUndefined();
  });

  it('rejects the exact same accountNumber+accountProvider pair twice', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();

    // The initial branch from registration already has this exact
    // accountNumber/accountProvider pair (see buildRegisterPayload).
    const res = await agent
      .post(`/api/v1/branches/${branchId}/accounts`)
      .set('X-CSRF-Token', csrfToken!)
      .send({ accountNumber: '1000000000', accountProvider: 'cbe' });

    expect(res.status).toBe(400);
  });
});
