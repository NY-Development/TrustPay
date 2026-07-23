import React, { useState } from 'react';
import { useAdminAuditLogs } from '../../hooks/useAdmin';

const ACTOR_TYPE_BADGE: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
  owner: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  employee: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

export default function AdminAuditLogsPage() {
  const [action, setAction] = useState('');
  const { data: logsRes, isLoading, refetch } = useAdminAuditLogs({
    action: action || undefined,
  });

  const logs = logsRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Audit Trace</h1>
          <p className="text-xs text-gray-500 mt-1">Trace user transactions, settings modifications, and administrative actions.</p>
        </div>
        <span className="bg-gray-500/10 text-gray-600 dark:text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-500/20">
          {logs.length} Entries
        </span>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#131b2e] p-4 rounded-xl border border-[#c2c6d9]/30 dark:border-white/10 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by action name (e.g. LOGIN, VERIFY_PAYMENT)..."
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          />
        </div>

        <button
          onClick={() => refetch()}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500 animate-pulse">Querying audit registries...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No audit logs matched filter rules.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-[#c2c6d9]/20 dark:border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">IP / User Agent</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d9]/10 dark:divide-white/5 text-sm">
                {logs.map((l: any) => (
                  <tr key={l._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase font-bold">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {l.actorName ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900 dark:text-white text-xs">{l.actorName}</div>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${ACTOR_TYPE_BADGE[l.actorType] || ACTOR_TYPE_BADGE.owner}`}>
                              {l.actorType}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono select-all">{l.actorEmail}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unknown Agent</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">{l.ip}</div>
                      <div className="text-[10px] text-gray-400 max-w-[200px] truncate" title={l.userAgent}>
                        {l.userAgent}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-350">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 max-w-[250px]">
                      {l.metadata && Object.keys(l.metadata).length > 0 ? (
                        <pre className="text-[9px] font-mono text-gray-500 bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-[80px] overflow-y-auto whitespace-pre-wrap select-all">
                          {JSON.stringify(l.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-400 text-[10px] italic">No payload</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
