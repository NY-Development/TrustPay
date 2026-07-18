import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();

/**
 * Pulls a cookie's value out of a Supertest response's raw Set-Cookie
 * headers — used to read the (deliberately non-httpOnly) csrf_token cookie
 * so tests can echo it back as X-CSRF-Token, the way the frontend does.
 */
export const getCookieValue = (res: request.Response, name: string): string | undefined => {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return undefined;
  const raw = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const entry of raw) {
    const match = entry.match(new RegExp(`^${name}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
};

let ownerCounter = 0;

export const buildRegisterPayload = (overrides: Partial<Record<string, any>> = {}) => {
  ownerCounter += 1;
  const n = ownerCounter;

  return {
    name: `Test Owner ${n}`,
    email: `owner${n}@test.trustpay.dev`,
    password: 'password123',
    companyInfo: {
      companyName: `Test Company ${n}`,
      companyType: 'RETAIL',
      country: 'Ethiopia',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      address: '123 Test Street',
    },
    initialBranch: {
      branchName: `Main Branch ${n}`,
      country: 'Ethiopia',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      address: '123 Test Street',
      phone: '0911000000',
      email: `branch${n}@test.trustpay.dev`,
      accounts: [{ accountNumber: '1000000000', accountProvider: 'cbe' }],
    },
    ...overrides,
  };
};

/**
 * Registers a fresh owner (with an initial branch) using a cookie-jar-backed
 * agent, mirroring how the web frontend authenticates. Returns the agent
 * (subsequent requests automatically carry the session cookies), the raw
 * response body, and the CSRF token to attach on mutating requests.
 */
export const registerOwner = async (overrides: Partial<Record<string, any>> = {}) => {
  const agent = request.agent(app);
  const payload = buildRegisterPayload(overrides);
  const res = await agent.post('/api/v1/auth/register').send(payload);

  if (res.status !== 201) {
    throw new Error(`registerOwner failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const csrfToken = getCookieValue(res, 'csrf_token');

  return { agent, res, payload, csrfToken, ownerId: res.body?.data?.owner?._id as string, branchId: res.body?.data?.branch?._id as string };
};

/**
 * Logs in as an employee (already invited via the owner-only invite
 * endpoint) using a fresh cookie-jar-backed agent.
 */
export const loginEmployee = async (email: string, password: string) => {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login/employee').send({ email, password });

  if (res.status !== 200) {
    throw new Error(`loginEmployee failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const csrfToken = getCookieValue(res, 'csrf_token');
  return { agent, res, csrfToken, employeeId: res.body?.data?.employee?._id as string };
};
