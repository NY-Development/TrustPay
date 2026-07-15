import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMessagesApi,
  getMessageApi,
  sendMessageApi,
  markMessageAsReadApi,
  getUnreadMessagesCountApi,
} from '@/src/api/communication.api';

export function useMessages() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: listMessagesApi,
  });
}

export function useMessage(id: string) {
  return useQuery({
    queryKey: ['message', id],
    queryFn: () => getMessageApi(id),
    enabled: !!id,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessageApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markMessageAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadMessagesCountApi,
    refetchInterval: 30000, // Poll every 30s
  });
}
