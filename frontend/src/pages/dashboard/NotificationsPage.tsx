import React from 'react';
import { useNotifications } from '@/src/hooks/useNotification';

export default function NotificationsPage() {
  const { data: notificationsRes, isLoading, markAsRead, clearAll } = useNotifications();
  const alerts = notificationsRes?.data || [];
  
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Workspace Alerts</h1>
          <p className="text-xs text-[#54647a]">Receipt flagging notifications, security logins, and billing alerts</p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={() => clearAll()}
            className="text-xs text-[#004bca] dark:text-[#549aff] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-gray-500 animate-pulse">Loading alerts data...</div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">notifications_off</span>
            Inbox clean. No workspace alerts found.
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert._id} 
              onClick={() => {
                if (!alert.isRead) {
                  markAsRead(alert._id);
                }
              }}
              className={`flex gap-4 p-4 rounded-xl border transition-all relative ${
                alert.isRead 
                  ? 'border-[#c2c6d9]/10 bg-transparent opacity-70' 
                  : 'border-[#004bca]/20 bg-[#004bca]/5 cursor-pointer hover:bg-[#004bca]/10'
              }`}
            >
              {!alert.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#004bca]" />
              )}
              
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                alert.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : alert.type === 'error'
                  ? 'bg-red-500/10 text-red-500'
                  : alert.type === 'warning'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-blue-500/10 text-blue-500'
              }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {alert.type === 'success' 
                    ? 'check_circle' 
                    : alert.type === 'error'
                    ? 'error'
                    : alert.type === 'warning'
                    ? 'warning'
                    : 'info'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#131b2e] dark:text-white flex items-center gap-2">
                  {alert.title}
                </h4>
                <p className="text-xs text-[#424656] dark:text-[#c2c6d9] mt-1">{alert.body}</p>
                <span className="text-[10px] text-gray-400 mt-2 block">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
