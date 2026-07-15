import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from '@/src/api/communication.api';

export function useMessages(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['messages', page, limit],
    queryFn: () => communicationApi.list(page, limit),
  });
}

export function useMessageDetail(id: string) {
  return useQuery({
    queryKey: ['message', id],
    queryFn: () => communicationApi.getById(id),
    enabled: !!id,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communicationApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communicationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: communicationApi.getUnreadCount,
    refetchInterval: 30000, // poll every 30s
  });
}
