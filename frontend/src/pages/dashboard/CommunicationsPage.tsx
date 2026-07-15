import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMessagesApi, sendMessageApi, markMessageAsReadApi } from '@/src/api/communication.api';
import { listEmployeesApi } from '@/src/api/employee.api';
import { listBranchesApi } from '@/src/api/branch.api';
import { useAuthStore } from '@/src/store/authStore';

export default function CommunicationsPage() {
  const { actorType } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCompose, setShowCompose] = useState(false);
  const [messageData, setMessageData] = useState({
    title: '', body: '', recipientType: 'COMPANY' as string, messageType: 'ANNOUNCEMENT' as string,
    branchId: '', recipientIds: [] as string[],
  });

  const { data: messagesRes, isLoading } = useQuery({
    queryKey: ['communications'],
    queryFn: listMessagesApi,
  });

  const { data: branchesRes } = useQuery({
    queryKey: ['branches'],
    queryFn: listBranchesApi,
    enabled: actorType === 'owner',
  });

  const { data: employeesRes } = useQuery({
    queryKey: ['employees'],
    queryFn: () => listEmployeesApi(),
    enabled: actorType === 'owner',
  });

  const sendMutation = useMutation({
    mutationFn: sendMessageApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      setShowCompose(false);
      setMessageData({ title: '', body: '', recipientType: 'COMPANY', messageType: 'ANNOUNCEMENT', branchId: '', recipientIds: [] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markMessageAsReadApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communications'] }),
  });

  const messages = messagesRes?.data || [];
  const branches = branchesRes?.data || [];
  const employees = employeesRes?.data || [];

  const messageTypeColors: Record<string, string> = {
    ANNOUNCEMENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    TASK: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    REMINDER: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    ALERT: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-white font-['Geist']">Communications</h1>
          <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mt-1">{actorType === 'owner' ? 'Broadcast messages to your team' : 'View received notifications'}</p>
        </div>
        {actorType === 'owner' && (
          <button
            onClick={() => setShowCompose(true)}
            className="bg-[#004bca] hover:bg-[#0061ff] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            New Message
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#004bca] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#c2c6d9] mb-4 block">chat</span>
          <p className="text-[#54647a] dark:text-[#c2c6d9]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg: any) => (
            <div
              key={msg._id}
              className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${messageTypeColors[msg.messageType] || messageTypeColors.ANNOUNCEMENT}`}>
                    {msg.messageType}
                  </span>
                  <span className="text-xs text-[#54647a] dark:text-[#c2c6d9]">
                    {msg.recipientType} • {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {actorType === 'employee' && !msg.readBy?.includes(useAuthStore.getState().user?._id) && (
                  <button
                    onClick={() => markReadMutation.mutate(msg._id)}
                    className="text-xs text-[#004bca] font-semibold hover:underline"
                  >
                    Mark Read
                  </button>
                )}
              </div>
              <h3 className="font-bold text-[#131b2e] dark:text-white text-sm mb-1">{msg.title}</h3>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">{msg.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#131b2e] dark:text-white mb-6 font-['Geist']">Compose Message</h3>
            <div className="space-y-4">
              <input
                placeholder="Subject"
                value={messageData.title}
                onChange={(e) => setMessageData({ ...messageData, title: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
              />
              <textarea
                placeholder="Message body..."
                rows={4}
                value={messageData.body}
                onChange={(e) => setMessageData({ ...messageData, body: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white resize-none"
              />
              <div className="flex gap-3">
                <select
                  value={messageData.recipientType}
                  onChange={(e) => setMessageData({ ...messageData, recipientType: e.target.value })}
                  className="flex-1 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
                >
                  <option value="COMPANY">Company-wide</option>
                  <option value="BRANCH">Branch</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
                <select
                  value={messageData.messageType}
                  onChange={(e) => setMessageData({ ...messageData, messageType: e.target.value })}
                  className="flex-1 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
                >
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="TASK">Task</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="ALERT">Alert</option>
                </select>
              </div>
              {messageData.recipientType === 'BRANCH' && (
                <select
                  value={messageData.branchId}
                  onChange={(e) => setMessageData({ ...messageData, branchId: e.target.value })}
                  className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
                >
                  <option value="">Select Branch</option>
                  {branches.map((b: any) => (
                    <option key={b._id} value={b._id}>{b.branchName}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCompose(false)} className="flex-1 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 py-3 rounded-xl text-sm font-bold text-[#131b2e] dark:text-white">
                Cancel
              </button>
              <button
                onClick={() => sendMutation.mutate(messageData)}
                disabled={sendMutation.isPending}
                className="flex-1 bg-[#004bca] hover:bg-[#0061ff] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {sendMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
