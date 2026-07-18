import request from 'supertest';
import { app, buildRegisterPayload, registerOwner } from './helpers';

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

import { sendEmail } from '../src/utils/email';

describe('POST /auth/register', () => {
  it('creates an owner with an initial branch and sets session cookies', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(buildRegisterPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.owner.email).toContain('@test.trustpay.dev');
    expect(res.body.data.branch.branchName).toBeDefined();

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(setCookie.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(setCookie.some((c) => c.startsWith('csrf_token='))).toBe(true);
    // access/refresh cookies must be httpOnly; csrf_token must NOT be (JS needs to read it)
    expect(setCookie.find((c) => c.startsWith('accessToken='))).toMatch(/HttpOnly/i);
    expect(setCookie.find((c) => c.startsWith('csrf_token='))).not.toMatch(/HttpOnly/i);
  });

  it('rejects a duplicate email', async () => {
    const payload = buildRegisterPayload();
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login/owner', () => {
  it('logs in with valid credentials', async () => {
    const { payload } = await registerOwner();

    const res = await request(app)
      .post('/api/v1/auth/login/owner')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.data.owner.email).toBe(payload.email);
  });

  it('rejects an invalid password', async () => {
    const { payload } = await registerOwner();

    const res = await request(app)
      .post('/api/v1/auth/login/owner')
      .send({ email: payload.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login/owner')
      .send({ email: 'nobody@test.trustpay.dev', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('cookie session lifecycle', () => {
  it('GET /auth/me works via the cookie set at login (no Authorization header)', async () => {
    const { agent, payload } = await registerOwner();

    const res = await agent.get('/api/v1/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(payload.email);
  });

  it('rejects requests with no session at all', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh issues new cookies from the refresh cookie', async () => {
    const { agent, csrfToken } = await registerOwner();

    const res = await agent.post('/api/v1/auth/refresh').set('X-CSRF-Token', csrfToken!).send({});

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('accessToken='))).toBe(true);
  });

  it('POST /auth/logout clears the session so a subsequent /auth/me fails', async () => {
    const { agent, csrfToken } = await registerOwner();

    const logoutRes = await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', csrfToken!);
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(401);
  });
});

describe('CSRF protection (double-submit cookie)', () => {
  it('rejects a cookie-authenticated mutating request with no X-CSRF-Token header', async () => {
    const { agent } = await registerOwner();

    const res = await agent.patch('/api/v1/auth/profile').send({ name: 'New Name' });

    expect(res.status).toBe(403);
  });

  it('rejects a mismatched X-CSRF-Token header', async () => {
    const { agent } = await registerOwner();

    const res = await agent
      .patch('/api/v1/auth/profile')
      .set('X-CSRF-Token', 'not-the-real-token')
      .send({ name: 'New Name' });

    expect(res.status).toBe(403);
  });

  it('accepts a mutating request when the header matches the csrf_token cookie', async () => {
    const { agent, csrfToken } = await registerOwner();

    const res = await agent
      .patch('/api/v1/auth/profile')
      .set('X-CSRF-Token', csrfToken!)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
  });

  it('does not require a CSRF header for GET requests', async () => {
    const { agent } = await registerOwner();
    const res = await agent.get('/api/v1/auth/me');
    expect(res.status).toBe(200);
  });
});

describe('password reset flow', () => {
  it('forgot-password -> verify-otp -> reset-password happy path', async () => {
    const { payload } = await registerOwner();
    const mockSendEmail = sendEmail as jest.Mock;
    mockSendEmail.mockClear();

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({ email: payload.email });
    expect(forgotRes.status).toBe(200);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const emailText = mockSendEmail.mock.calls[0][2] as string;
    const otp = emailText.match(/Your OTP is: (\d{6})/)?.[1];
    expect(otp).toBeDefined();

    const verifyRes = await request(app).post('/api/v1/auth/verify-otp').send({ email: payload.email, otp });
    expect(verifyRes.status).toBe(200);
    const resetToken = verifyRes.body.data.resetToken;
    expect(resetToken).toBeDefined();

    const newPassword = 'brand-new-password-1';
    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({ resetToken, password: newPassword });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login/owner')
      .send({ email: payload.email, password: newPassword });
    expect(loginRes.status).toBe(200);
  });

  it('rejects an incorrect OTP', async () => {
    const { payload } = await registerOwner();
    await request(app).post('/api/v1/auth/forgot-password').send({ email: payload.email });

    const res = await request(app).post('/api/v1/auth/verify-otp').send({ email: payload.email, otp: '000000' });
    expect(res.status).toBe(400);
  });
});

describe('employee login', () => {
  it('logs an invited employee in and scopes their session to their branch', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();

    const inviteRes = await agent
      .post('/api/v1/employees/invite')
      .set('X-CSRF-Token', csrfToken!)
      .send({
        name: 'Test Cashier',
        email: 'cashier@test.trustpay.dev',
        password: 'password123',
        role: 'CASHIER',
        branchId,
      });
    expect(inviteRes.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/v1/auth/login/employee')
      .send({ email: 'cashier@test.trustpay.dev', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.employee.branchId).toBe(branchId);
  });

  it('rejects a deactivated employee', async () => {
    const { agent, csrfToken, branchId } = await registerOwner();

    const inviteRes = await agent
      .post('/api/v1/employees/invite')
      .set('X-CSRF-Token', csrfToken!)
      .send({
        name: 'Test Cashier',
        email: 'inactive-cashier@test.trustpay.dev',
        password: 'password123',
        role: 'CASHIER',
        branchId,
      });
    const employeeId = inviteRes.body.data._id;

    await agent.put(`/api/v1/employees/${employeeId}/deactivate`).set('X-CSRF-Token', csrfToken!);

    const loginRes = await request(app)
      .post('/api/v1/auth/login/employee')
      .send({ email: 'inactive-cashier@test.trustpay.dev', password: 'password123' });

    expect(loginRes.status).toBe(401);
  });
});
