import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeeDetailPage from '@/src/pages/dashboard/EmployeeDetailPage';

const renderEmployeeDetailPage = (id = 'employee-1') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/dashboard/employees/${id}`]}>
        <Routes>
          <Route path="/dashboard/employees/:id" element={<EmployeeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EmployeeDetailPage', () => {
  it('renders employee details from the API', async () => {
    renderEmployeeDetailPage();
    expect(await screen.findByText('Test Employee', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('employee@test.dev')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('deactivates an active employee', async () => {
    const user = userEvent.setup();
    renderEmployeeDetailPage();
    await screen.findByText('Test Employee', { selector: 'h2' });

    await user.click(screen.getByRole('button', { name: /deactivate account/i }));

    expect(await screen.findByText(/status deactivated/i)).toBeInTheDocument();
  });

  it('opens the reset password modal and validates the minimum length', async () => {
    const user = userEvent.setup();
    renderEmployeeDetailPage();
    await screen.findByText('Test Employee', { selector: 'h2' });

    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await user.type(screen.getByPlaceholderText(/new password/i), '123');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(screen.getByPlaceholderText(/new password/i)).toBeInTheDocument());
  });
});
