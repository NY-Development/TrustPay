import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscription.api';

export const useSubscriptionStatus = (enabled = true) => {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionApi.getStatus,
    enabled,
    refetchInterval: 15000, // Background poll every 15s to automatically lift lock when verified
  });
};

export const useVerifySubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionApi.verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    },
  });
};
