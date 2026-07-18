import { http, HttpResponse } from 'msw';

export const API_BASE = 'http://localhost:5000/api/v1';

export const mockOwner = {
  _id: 'owner-1',
  name: 'Test Owner',
  email: 'owner@test.dev',
  role: 'OWNER',
};

export const mockBranch = {
  _id: 'branch-1',
  branchName: 'Main Branch',
  branchCode: 'RTL-001',
};

export const mockEmployee = {
  _id: 'employee-1',
  name: 'Test Employee',
  email: 'employee@test.dev',
  role: 'CASHIER',
  status: 'ACTIVE',
  branchId: mockBranch,
};

export const handlers = [
  http.post(`${API_BASE}/auth/login/owner`, async ({ request }) => {
    const body = (await request.json()) as any;

    if (body.password !== 'correct-password') {
      return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      message: 'Owner logged in successfully',
      data: { owner: mockOwner, selectedBranch: mockBranch, accessToken: 'a', refreshToken: 'r' },
    });
  }),

  http.post(`${API_BASE}/auth/logout`, () => HttpResponse.json({ success: true, data: null })),

  http.get(`${API_BASE}/employees`, () =>
    HttpResponse.json({ success: true, data: [mockEmployee] })
  ),

  http.get(`${API_BASE}/employees/:id`, ({ params }) =>
    HttpResponse.json({ success: true, data: { ...mockEmployee, _id: params.id } })
  ),

  http.post(`${API_BASE}/employees/invite`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      success: true,
      message: 'Employee invited successfully',
      data: { ...mockEmployee, ...body, _id: 'employee-new' },
    });
  }),

  http.put(`${API_BASE}/employees/:id/deactivate`, ({ params }) =>
    HttpResponse.json({ success: true, data: { ...mockEmployee, _id: params.id, status: 'INACTIVE' } })
  ),

  http.put(`${API_BASE}/employees/:id/activate`, ({ params }) =>
    HttpResponse.json({ success: true, data: { ...mockEmployee, _id: params.id, status: 'ACTIVE' } })
  ),

  http.get(`${API_BASE}/branches`, () => HttpResponse.json({ success: true, data: [mockBranch] })),

  http.get(`${API_BASE}/auth/me`, () =>
    HttpResponse.json({ success: true, data: { actorType: 'owner', user: mockOwner, branch: mockBranch } })
  ),
];
