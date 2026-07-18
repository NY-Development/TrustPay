import request from 'supertest';
import { app, registerOwner, loginEmployee } from './helpers';

const inviteEmployee = (
  agent: any,
  csrfToken: string,
  branchId: string,
  overrides: Partial<Record<string, any>> = {}
) =>
  agent
    .post('/api/v1/employees/invite')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Test Employee',
      email: `employee-${Date.now()}-${Math.random().toString(36).slice(2)}@test.trustpay.dev`,
      password: 'password123',
      role: 'CASHIER',
      branchId,
      ...overrides,
    });

describe('POST /employees/invite', () => {
  it('lets an owner invite an employee to their own branch', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    const res = await inviteEmployee(agent, csrfToken!, branchId);

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('CASHIER');
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('rejects invite from an employee actor (owner-only)', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    await inviteEmployee(agent, csrfToken!, branchId, { email: 'staff@test.trustpay.dev' });
    const { agent: empAgent, csrfToken: empCsrf } = await loginEmployee('staff@test.trustpay.dev', 'password123');

    const res = await inviteEmployee(empAgent, empCsrf!, branchId, { email: 'another@test.trustpay.dev' });
    expect(res.status).toBe(403);
  });

  it('rejects inviting into a branch the caller does not own', async () => {
    const { agent: ownerA, csrfToken: csrfA } = await registerOwner();
    const { branchId: branchB } = await registerOwner();

    const res = await inviteEmployee(ownerA, csrfA!, branchB);
    expect(res.status).toBe(403);
  });

  it('rejects a duplicate email', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    await inviteEmployee(agent, csrfToken!, branchId, { email: 'dup@test.trustpay.dev' });
    const res = await inviteEmployee(agent, csrfToken!, branchId, { email: 'dup@test.trustpay.dev' });
    expect(res.status).toBe(409);
  });
});

describe('GET /employees (list scoping)', () => {
  it('shows an owner only their own employees', async () => {
    const { agent: ownerA, csrfToken: csrfA, branchId: branchA } = await registerOwner();
    const { agent: ownerB, csrfToken: csrfB, branchId: branchB } = await registerOwner();

    await inviteEmployee(ownerA, csrfA!, branchA, { email: 'a1@test.trustpay.dev' });
    await inviteEmployee(ownerB, csrfB!, branchB, { email: 'b1@test.trustpay.dev' });

    const res = await ownerA.get('/api/v1/employees');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe('a1@test.trustpay.dev');
  });

  it('scopes an employee to only their own branch', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    await inviteEmployee(agent, csrfToken!, branchId, { email: 'colleague1@test.trustpay.dev' });
    await inviteEmployee(agent, csrfToken!, branchId, { email: 'colleague2@test.trustpay.dev' });

    const { agent: empAgent } = await loginEmployee('colleague1@test.trustpay.dev', 'password123');
    const res = await empAgent.get('/api/v1/employees');

    expect(res.status).toBe(200);
    expect(res.body.data.map((e: any) => e.email).sort()).toEqual(
      ['colleague1@test.trustpay.dev', 'colleague2@test.trustpay.dev'].sort()
    );
  });
});

describe('GET /employees/:id', () => {
  it('rejects cross-owner access to another company\'s employee', async () => {
    const { agent: ownerA, csrfToken: csrfA, branchId: branchA } = await registerOwner();
    const { agent: ownerB } = await registerOwner();

    const inviteRes = await inviteEmployee(ownerA, csrfA!, branchA, { email: 'private@test.trustpay.dev' });
    const employeeId = inviteRes.body.data._id;

    const res = await ownerB.get(`/api/v1/employees/${employeeId}`);
    expect(res.status).toBe(403);
  });
});

describe('employee lifecycle (update/deactivate/activate/delete/move-branch/reset-password)', () => {
  it('updates name and role', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    const inviteRes = await inviteEmployee(agent, csrfToken!, branchId);
    const employeeId = inviteRes.body.data._id;

    const res = await agent
      .put(`/api/v1/employees/${employeeId}`)
      .set('X-CSRF-Token', csrfToken!)
      .send({ name: 'Renamed', role: 'MANAGER' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed');
    expect(res.body.data.role).toBe('MANAGER');
  });

  it('deactivates then reactivates an employee', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    const inviteRes = await inviteEmployee(agent, csrfToken!, branchId);
    const employeeId = inviteRes.body.data._id;

    const deactivateRes = await agent
      .put(`/api/v1/employees/${employeeId}/deactivate`)
      .set('X-CSRF-Token', csrfToken!);
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.status).toBe('INACTIVE');

    const activateRes = await agent
      .put(`/api/v1/employees/${employeeId}/activate`)
      .set('X-CSRF-Token', csrfToken!);
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe('ACTIVE');
  });

  it('resets an employee password and the new password works at login', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    const inviteRes = await inviteEmployee(agent, csrfToken!, branchId, { email: 'resetme@test.trustpay.dev' });
    const employeeId = inviteRes.body.data._id;

    const resetRes = await agent
      .put(`/api/v1/employees/${employeeId}/reset-password`)
      .set('X-CSRF-Token', csrfToken!)
      .send({ password: 'new-password-99' });
    expect(resetRes.status).toBe(200);

    const { res: loginRes } = await loginEmployee('resetme@test.trustpay.dev', 'new-password-99');
    expect(loginRes.status).toBe(200);
  });

  it('moves an employee to a different branch owned by the same owner', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    const inviteRes = await inviteEmployee(agent, csrfToken!, branchId);
    const employeeId = inviteRes.body.data._id;

    const newBranchRes = await agent
      .post('/api/v1/branches')
      .set('X-CSRF-Token', csrfToken!)
      .send({
        branchName: 'Second Branch',
        region: 'Addis Ababa',
        city: 'Addis Ababa',
        address: '456 Test Ave',
        phone: '0911000001',
        email: 'branch2@test.trustpay.dev',
      });
    expect(newBranchRes.status).toBe(201);
    const newBranchId = newBranchRes.body.data._id;

    const moveRes = await agent
      .put(`/api/v1/employees/${employeeId}/move-branch`)
      .set('X-CSRF-Token', csrfToken!)
      .send({ branchId: newBranchId });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.branchId).toBe(newBranchId);
  });

  it('deletes an employee', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();
    const inviteRes = await inviteEmployee(agent, csrfToken!, branchId);
    const employeeId = inviteRes.body.data._id;

    const deleteRes = await agent
      .delete(`/api/v1/employees/${employeeId}`)
      .set('X-CSRF-Token', csrfToken!);
    expect(deleteRes.status).toBe(200);

    const getRes = await agent.get(`/api/v1/employees/${employeeId}`);
    expect(getRes.status).toBe(404);
  });
});

// Sanity check the shared app instance from helpers is the one under test.
describe('app wiring', () => {
  it('exposes the employees route', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(401); // unauthenticated — proves the route exists and auth is enforced
  });
});
