import request from 'supertest';
import { app, registerOwner } from './helpers';

describe('GET /public/stats', () => {
  it('is reachable without authentication and reflects real data', async () => {
    const { payload } = await registerOwner();

    // Trusted-by is a marketing showcase, not a security boundary — any
    // owner with a filled-in company name shows up, regardless of the
    // (unrelated) admin license-approval status.
    const res = await request(app).get('/api/v1/public/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companies).toBeGreaterThanOrEqual(1);
    expect(res.body.data.branches).toBeGreaterThanOrEqual(1);
    expect(res.body.data.trustedCompanies.some((c: any) => c.companyName === payload.companyInfo.companyName)).toBe(true);
    expect(typeof res.body.data.successRate).toBe('number');
  });

  it('does not require a CSRF token (GET, unauthenticated)', async () => {
    const res = await request(app).get('/api/v1/public/stats');
    expect(res.status).toBe(200);
  });
});
