import React, { useState } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';

export default function ExportPage() {
  const { data, isLoading } = useVerificationHistory({ limit: 100 });
  const verifications = data?.pages?.flatMap(page => page.data) || [];

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifications.length === 0) return;

    // Filter by dates if selected
    const filtered = verifications.filter((item: any) => {
      const itemDate = new Date(item.createdAt);
      if (dateFrom && itemDate < new Date(dateFrom)) return false;
      if (dateTo && itemDate > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });

    const headers = ['Reference Number', 'Amount', 'Currency', 'Provider', 'Payer Name', 'Status', 'Date Checked'];
    const csvRows = [headers.join(',')];

    filtered.forEach((item: any) => {
      const row = [
        item.referenceNumber,
        item.amount,
        item.currency || 'ETB',
        item.provider,
        `"${(item.payerName || '').replace(/"/g, '""')}"`,
        item.status,
        new Date(item.createdAt).toISOString()
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reconciliation_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Export Audit Logs</h1>
        <p className="text-xs text-[#54647a]">Download cashier verified reference tables to Excel / CSV format</p>
      </div>

      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-lg">
        <form onSubmit={handleExport} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || verifications.length === 0}
            className="w-full bg-[#004bca] hover:bg-[#0061ff] text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
            <span>Export Report (CSV)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
