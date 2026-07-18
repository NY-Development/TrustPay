import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/src/pages/auth/LoginPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const renderLoginPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('renders the owner login form by default', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /sign in as owner/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@company.com/i)).toBeInTheDocument();
  });

  it('logs in successfully and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/name@company.com/i), 'owner@test.dev');
    await user.type(screen.getByPlaceholderText('••••••••'), 'correct-password');
    await user.click(screen.getByRole('button', { name: /sign in as owner/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows an error message on invalid credentials', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/name@company.com/i), 'owner@test.dev');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in as owner/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('switches to employee mode and hides the branch code field', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    expect(screen.getByPlaceholderText(/e.g. HTL-001/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^employee$/i }));

    expect(screen.queryByPlaceholderText(/e.g. HTL-001/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in as employee/i })).toBeInTheDocument();
  });
});
