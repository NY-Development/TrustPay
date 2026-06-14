import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../api/verification.api';

export const useVerifyManual = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificationApi.verifyManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
};

export const useVerifyUniversal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificationApi.verifyUniversal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
};

export const useVerifyOcr = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificationApi.verifyOcr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
};

export const useVerificationHistory = () => {
  return useQuery({
    queryKey: ['verifications'],
    queryFn: verificationApi.getHistory,
  });
};
