import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { API_BASE } from './mocks/handlers';
import { apiClient } from '@/src/api/client';

describe('apiClient', () => {
  beforeEach(() => {
    document.cookie = 'csrf_token=test-csrf-value';
  });

  it('attaches X-CSRF-Token on mutating requests', async () => {
    let capturedHeader: string | null = null;

    server.use(
      http.post(`${API_BASE}/employees/invite`, ({ request }) => {
        capturedHeader = request.headers.get('x-csrf-token');
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    await apiClient.post('/employees/invite', { name: 'x' });
    expect(capturedHeader).toBe('test-csrf-value');
  });

  it('does not attach X-CSRF-Token on GET requests', async () => {
    let capturedHeader: string | null | undefined = undefined;

    server.use(
      http.get(`${API_BASE}/employees`, ({ request }) => {
        capturedHeader = request.headers.get('x-csrf-token');
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    await apiClient.get('/employees');
    expect(capturedHeader).toBeNull();
  });

  it('on a 401, silently refreshes via cookie and retries the original request', async () => {
    let meAttempts = 0;
    let refreshCalls = 0;

    server.use(
      http.get(`${API_BASE}/branches`, () => {
        meAttempts += 1;
        if (meAttempts === 1) {
          return HttpResponse.json({ success: false, message: 'Access token expired.' }, { status: 401 });
        }
        return HttpResponse.json({ success: true, data: [{ _id: 'branch-1' }] });
      }),
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    const res = await apiClient.get('/branches');

    expect(refreshCalls).toBe(1);
    expect(meAttempts).toBe(2);
    expect(res.data.data).toEqual([{ _id: 'branch-1' }]);
  });

  it('emits unauthorized and does not loop when refresh itself fails', async () => {
    server.use(
      http.get(`${API_BASE}/branches`, () =>
        HttpResponse.json({ success: false, message: 'Access token expired.' }, { status: 401 })
      ),
      http.post(`${API_BASE}/auth/refresh`, () =>
        HttpResponse.json({ success: false, message: 'Invalid or expired refresh token' }, { status: 401 })
      )
    );

    await expect(apiClient.get('/branches')).rejects.toBeTruthy();
  });
});
