import {apiClient} from './client'; // Adjust path to your base Axios instance

export interface NotificationItem {
  _id: string;
  userId: string;
  businessId?: string;
  auditLogId?: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsEnvelope {
  success: boolean;
  data: NotificationItem[];
}

export interface SingleNotificationEnvelope {
  success: boolean;
  data: NotificationItem;
}

export const NotificationApiService = {
  /**
   * Fetch all notifications for the authenticated merchant session
   */
  async getMyNotifications(): Promise<NotificationsEnvelope> {
    const response = await apiClient.get<NotificationsEnvelope>('/notifications');
    return response.data;
  },

  /**
   * Mark an individual notification item as read
   */
  async markAsRead(id: string): Promise<SingleNotificationEnvelope> {
    const response = await apiClient.patch<SingleNotificationEnvelope>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Bulk change all unread notifications to read status
   */
  async clearAllNotifications(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/notifications');
    return response.data;
  },
};