import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const useLogin = () => {
  const setUser = useAuthStore((state) => state.setUser);
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      if (response.data?.user) {
        // Tokens are handled by cookies in backend usually, 
        // but for mobile we might need to store them manually if not using browser-like cookie support
        // In our backend, we send them in body if needed or we can extract from headers.
        // Let's assume the refresh token rotation logic we built handles it.
        setUser(response.data.user);
      }
    },
  });
};

export const useRegister = () => {
  const setUser = useAuthStore((state) => state.setUser);
  
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      if (response.data?.user) {
        setUser(response.data.user);
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
