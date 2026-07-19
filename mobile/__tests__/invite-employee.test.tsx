// Smoke test proving the RNTL + nativewind + expo-router mocking harness
// works end-to-end — a foundation later phases can build broader screen
// coverage on top of, rather than an unverified setup.

jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light' }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('@/src/store/authStore', () => ({
  useAuthStore: (selector: any) =>
    selector({
      branches: [{ _id: 'branch-1', branchName: 'Main Branch', branchCode: 'RTL-001' }],
      selectedBranch: { _id: 'branch-1', branchName: 'Main Branch', branchCode: 'RTL-001' },
    }),
}));

jest.mock('@/src/hooks/useEmployee', () => ({
  useEmployees: () => ({
    createEmployee: jest.fn(),
    isCreating: false,
  }),
}));

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import InviteEmployeeScreen from './invite-employee';

describe('InviteEmployeeScreen (smoke)', () => {
  it('renders the invite form with the default branch pre-selected', async () => {
    await render(<InviteEmployeeScreen />);

    expect(screen.getByText('Invite Employee')).toBeTruthy();
    expect(screen.getByPlaceholderText('Employee name')).toBeTruthy();
    expect(screen.getByPlaceholderText('employee@business.com')).toBeTruthy();
    expect(screen.getByText('Send Invitation')).toBeTruthy();
    expect(screen.getByText('Main Branch (RTL-001)')).toBeTruthy();
  });
});
