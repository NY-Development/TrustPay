import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

export const useLogin = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response: any) => {
      if (response.data?.user) {
        const { accessToken, refreshToken, user, selectedBranch, branches } = response.data;
        const actorType = user?.actorType || (user?.role === 'OWNER' ? 'owner' : 'employee');
        await setUser(user, { accessToken, refreshToken }, {
          actorType,
          selectedBranch,
          branches: branches || [],
        });
      }
    },
  });
};

export const useRegister = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (response: any) => {
      if (response.data?.user) {
        const { accessToken, refreshToken, user, selectedBranch, branches } = response.data;
        await setUser(user, { accessToken, refreshToken }, {
          actorType: 'owner',
          selectedBranch,
          branches: branches || [],
        });
      }
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
};

export const useMe = () => {
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
  });

  useEffect(() => {
    if (query.data?.data?.user) {
      setUser(query.data.data.user);
    }
  }, [query.data, setUser]);

  return query;
};

// ─── Profile ───────────────────────────────────────

export const useUpdateProfile = () => {
  const refreshUser = useAuthStore((state) => state.refreshUser);

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      refreshUser();
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: authApi.changePassword,
  });
};

// ─── Accounts ──────────────────────────────────────

export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: authApi.getAccounts,
  });
};

export const useAddAccount = () => {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);

  return useMutation({
    mutationFn: authApi.addAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      refreshUser();
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);

  return useMutation({
    mutationFn: authApi.updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      refreshUser();
    },
  });
};

export const useRemoveAccount = () => {
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);

  return useMutation({
    mutationFn: authApi.removeAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      refreshUser();
    },
  });
};
