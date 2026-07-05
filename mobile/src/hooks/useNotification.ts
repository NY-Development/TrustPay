import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationApiService, NotificationItem } from '@/src/api/notification.api';

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

/**
 * Custom hook to manage notification state updates throughout the interface
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  // 1. Fetch Notification Feed Data Hook
  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => NotificationApiService.getMyNotifications(),
    // Keep caching active for real-time background dashboard re-validations
    staleTime: 1000 * 30, 
  });

  // 2. Mark Single Item As Read Mutation Hook
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => NotificationApiService.markAsRead(id),
    onSuccess: (updatedRes) => {
      // Optimistically adjust specific caching matrix details instantly
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item: NotificationItem) =>
            item._id === updatedRes.data._id ? updatedRes.data : item
          ),
        };
      });
    },
  });

  // 3. Clear/Read All Items Bulk Mutation Hook
  const clearAllMutation = useMutation({
    mutationFn: () => NotificationApiService.clearAllNotifications(),
    onSuccess: () => {
      // Optimistically flag all cached array indexes to true to update UI instantly
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item: NotificationItem) => ({ ...item, isRead: true })),
        };
      });
      // Force background synchronization pipeline updates
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    ...query,
    markAsRead: markAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    clearAll: clearAllMutation.mutate,
    isClearingAll: clearAllMutation.isPending,
  };
}