jest.mock('@/src/api/employee.api');

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees, useEmployeeDetail } from './useEmployee';
import { employeeApi } from '@/src/api/employee.api';

const mockedEmployeeApi = jest.mocked(employeeApi);

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useEmployees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the employee list', async () => {
    mockedEmployeeApi.list.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [{ _id: 'e1', name: 'Cashier One', email: 'c1@test.dev', role: 'CASHIER', status: 'ACTIVE' } as any],
    });

    const { result } = await renderHook(() => useEmployees('branch-1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedEmployeeApi.list).toHaveBeenCalledWith('branch-1');
    expect(result.current.employees).toHaveLength(1);
    expect(result.current.employees[0].name).toBe('Cashier One');
  });

  it('createEmployee calls employeeApi.create with the given payload', async () => {
    mockedEmployeeApi.list.mockResolvedValue({ success: true, message: 'ok', data: [] });
    mockedEmployeeApi.create.mockResolvedValue({ success: true, message: 'ok', data: {} as any });

    const { result } = await renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createEmployee({
        name: 'New Hire',
        email: 'new@test.dev',
        password: 'password123',
        role: 'CASHIER',
        branchId: 'branch-1',
      });
    });

    // React Query v5 calls mutationFn(variables, context) — assert on the
    // variables (first arg) only, not the internal context object.
    expect(mockedEmployeeApi.create.mock.calls[0][0]).toEqual({
      name: 'New Hire',
      email: 'new@test.dev',
      password: 'password123',
      role: 'CASHIER',
      branchId: 'branch-1',
    });
  });

  it('deactivateEmployee and activateEmployee call the right endpoints', async () => {
    mockedEmployeeApi.list.mockResolvedValue({ success: true, message: 'ok', data: [] });
    mockedEmployeeApi.deactivate.mockResolvedValue({ success: true, message: 'ok', data: {} as any });
    mockedEmployeeApi.activate.mockResolvedValue({ success: true, message: 'ok', data: {} as any });

    const { result } = await renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deactivateEmployee('e1');
    });
    expect(mockedEmployeeApi.deactivate.mock.calls[0][0]).toBe('e1');

    await act(async () => {
      await result.current.activateEmployee('e1');
    });
    expect(mockedEmployeeApi.activate.mock.calls[0][0]).toBe('e1');
  });

  it('moveEmployeeBranch and resetEmployeePassword pass through id + payload', async () => {
    mockedEmployeeApi.list.mockResolvedValue({ success: true, message: 'ok', data: [] });
    mockedEmployeeApi.moveBranch.mockResolvedValue({ success: true, message: 'ok', data: {} as any });
    mockedEmployeeApi.resetPassword.mockResolvedValue({ success: true, message: 'ok', data: null });

    const { result } = await renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveEmployeeBranch({ id: 'e1', branchId: 'branch-2' });
    });
    expect(mockedEmployeeApi.moveBranch.mock.calls[0].slice(0, 2)).toEqual(['e1', 'branch-2']);

    await act(async () => {
      await result.current.resetEmployeePassword({ id: 'e1', password: 'new-pass' });
    });
    expect(mockedEmployeeApi.resetPassword.mock.calls[0].slice(0, 2)).toEqual(['e1', 'new-pass']);
  });
});

describe('useEmployeeDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single employee by id', async () => {
    mockedEmployeeApi.getById.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { _id: 'e1', name: 'Cashier One' } as any,
    });

    const { result } = await renderHook(() => useEmployeeDetail('e1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedEmployeeApi.getById).toHaveBeenCalledWith('e1');
    expect(result.current.data?.data?.name).toBe('Cashier One');
  });

  it('does not fetch when id is empty', async () => {
    await renderHook(() => useEmployeeDetail(''), { wrapper });
    expect(mockedEmployeeApi.getById).not.toHaveBeenCalled();
  });
});
