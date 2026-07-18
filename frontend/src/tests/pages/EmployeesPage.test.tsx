import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeesPage from '@/src/pages/dashboard/EmployeesPage';
import { useAuthStore } from '@/src/store/authStore';

const renderEmployeesPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EmployeesPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ actorType: 'owner', selectedBranch: null });
  });

  it('renders the employee list from the API', async () => {
    renderEmployeesPage();
    expect(await screen.findByText('Test Employee')).toBeInTheDocument();
    expect(screen.getByText('employee@test.dev')).toBeInTheDocument();
  });

  it('opens the invite modal and blocks submit with missing fields', async () => {
    const user = userEvent.setup();
    renderEmployeesPage();
    await screen.findByText('Test Employee');

    await user.click(screen.getByRole('button', { name: /invite employee/i }));
    expect(screen.getByText(/invite employee/i, { selector: 'h3' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /send invite/i }));
    expect(await screen.findByText(/input error/i)).toBeInTheDocument();
  });

  it('invites an employee successfully', async () => {
    const user = userEvent.setup();
    renderEmployeesPage();
    await screen.findByText('Test Employee');

    await user.click(screen.getByRole('button', { name: /invite employee/i }));
    await user.type(screen.getByPlaceholderText('Full Name'), 'New Hire');
    await user.type(screen.getByPlaceholderText('Email'), 'newhire@test.dev');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    // Branch dropdown loads asynchronously — wait for the real option to appear.
    await screen.findByRole('option', { name: /main branch/i });
    await user.selectOptions(screen.getByDisplayValue('Select Branch'), 'branch-1');

    await user.click(screen.getByRole('button', { name: /send invite/i }));

    await waitFor(() => expect(screen.queryByPlaceholderText('Full Name')).not.toBeInTheDocument());
  });
});
