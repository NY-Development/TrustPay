import request from 'supertest';
import { app, registerOwner } from './helpers';
import { User } from '../src/models/User';

describe('GET /public/stats', () => {
  it('is reachable without authentication and reflects real data', async () => {
    const { payload, ownerId } = await registerOwner();

    // Fresh registrations start PENDING_LICENSE — only ACTIVE (approved)
    // owners should ever show up in the public "trusted by" list.
    await User.findByIdAndUpdate(ownerId, { ownerStatus: 'ACTIVE' });

    const res = await request(app).get('/api/v1/public/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companies).toBeGreaterThanOrEqual(1);
    expect(res.body.data.branches).toBeGreaterThanOrEqual(1);
    expect(res.body.data.trustedCompanies.some((c: any) => c.name === payload.companyInfo.companyName)).toBe(true);
    expect(typeof res.body.data.successRate).toBe('number');
  });

  it('does not require a CSRF token (GET, unauthenticated)', async () => {
    const res = await request(app).get('/api/v1/public/stats');
    expect(res.status).toBe(200);
  });
});
