import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { API_BASE } from './mocks/handlers';
import { apiClient } from '@/src/api/client';
import { TokenService } from '@/src/services/token.service';

describe('apiClient', () => {
  beforeEach(async () => {
    await TokenService.clearTokens();
  });

  it('attaches a Bearer Authorization header when an access token is stored', async () => {
    await TokenService.saveAccessToken('test-access-token');
    let capturedHeader: string | null = null;

    server.use(
      http.get(`${API_BASE}/employees`, ({ request }) => {
        capturedHeader = request.headers.get('authorization');
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    await apiClient.get('/employees');
    expect(capturedHeader).toBe('Bearer test-access-token');
  });

  it('does not attach an Authorization header when no token is stored', async () => {
    let capturedHeader: string | null | undefined = undefined;

    server.use(
      http.get(`${API_BASE}/employees`, ({ request }) => {
        capturedHeader = request.headers.get('authorization');
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    await apiClient.get('/employees');
    expect(capturedHeader).toBeNull();
  });

  it('on a 401, silently refreshes using the stored refresh token and retries the original request', async () => {
    await TokenService.saveAccessToken('stale-access-token');
    await TokenService.saveRefreshToken('valid-refresh-token');

    let meAttempts = 0;
    let refreshCalls = 0;
    let refreshBody: any = null;

    server.use(
      http.get(`${API_BASE}/branches`, ({ request }) => {
        meAttempts += 1;
        if (meAttempts === 1) {
          expect(request.headers.get('authorization')).toBe('Bearer stale-access-token');
          return HttpResponse.json({ success: false, message: 'Access token expired.' }, { status: 401 });
        }
        expect(request.headers.get('authorization')).toBe('Bearer new-access-token');
        return HttpResponse.json({ success: true, data: [{ _id: 'branch-1' }] });
      }),
      http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
        refreshCalls += 1;
        refreshBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
        });
      })
    );

    const res = await apiClient.get('/branches');

    expect(refreshBody).toEqual({ refreshToken: 'valid-refresh-token' });
    expect(refreshCalls).toBe(1);
    expect(meAttempts).toBe(2);
    expect(res.data.data).toEqual([{ _id: 'branch-1' }]);
    expect(await TokenService.getAccessToken()).toBe('new-access-token');
    expect(await TokenService.getRefreshToken()).toBe('new-refresh-token');
  });

  it('emits unauthorized and clears tokens when there is no refresh token to retry with', async () => {
    await TokenService.saveAccessToken('stale-access-token');

    server.use(
      http.get(`${API_BASE}/branches`, () =>
        HttpResponse.json({ success: false, message: 'Access token expired.' }, { status: 401 })
      )
    );

    await expect(apiClient.get('/branches')).rejects.toBeTruthy();
    expect(await TokenService.getAccessToken()).toBeNull();
  });

  it('emits unauthorized and does not loop when refresh itself fails', async () => {
    await TokenService.saveAccessToken('stale-access-token');
    await TokenService.saveRefreshToken('expired-refresh-token');

    server.use(
      http.get(`${API_BASE}/branches`, () =>
        HttpResponse.json({ success: false, message: 'Access token expired.' }, { status: 401 })
      ),
      http.post(`${API_BASE}/auth/refresh`, () =>
        HttpResponse.json({ success: false, message: 'Invalid or expired refresh token' }, { status: 401 })
      )
    );

    await expect(apiClient.get('/branches')).rejects.toBeTruthy();
    expect(await TokenService.getAccessToken()).toBeNull();
  });
});
