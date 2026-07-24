import React, { useState } from 'react';
import { format } from 'date-fns';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { exportToPDF } from '@/src/utils/pdfExport';
import { DatePicker } from '@/components/ui/date-picker';

export default function ExportPage() {
  const { data, isLoading } = useVerificationHistory({ limit: 100 });
  const verifications = data?.pages?.flatMap(page => page.data) || [];

  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const getFilteredVerifications = () => {
    return verifications.filter((item: any) => {
      const itemDate = new Date(item.createdAt);
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999);
        if (itemDate > endOfDay) return false;
      }
      return true;
    });
  };

  const handleExportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = getFilteredVerifications();
    if (filtered.length === 0) return;

    const headers = ['Reference Number', 'Amount', 'Currency', 'Provider', 'Payer Name', 'Status', 'Date Checked'];
    const csvRows = [headers.join(',')];

    filtered.forEach((item: any) => {
      const row = [
        item.referenceNumber,
        item.amount,
        item.currency || 'ETB',
        item.provider,
        `"${(item.payerName || '').replace(/"/g, '""')}"`,
        item.processingStatus || item.verificationStatus,
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

  const handleExportPDF = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = getFilteredVerifications();
    if (filtered.length === 0) return;
    exportToPDF(filtered, dateFrom ? format(dateFrom, 'PPP') : undefined, dateTo ? format(dateTo, 'PPP') : undefined);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Export Audit Logs</h1>
        <p className="text-xs text-[#54647a]">Download cashier verified reference tables to Excel/CSV or PDF formats</p>
      </div>

      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-lg">
        <form className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">From Date</label>
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                placeholder="Any"
                disabled={dateTo ? (date) => date > dateTo : undefined}
                className="bg-[#faf8ff] dark:bg-[#0b0e14] border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs text-[#131b2e] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">To Date</label>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                placeholder="Any"
                disabled={dateFrom ? (date) => date < dateFrom : undefined}
                className="bg-[#faf8ff] dark:bg-[#0b0e14] border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs text-[#131b2e] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isLoading || verifications.length === 0}
              className="bg-[#004bca] hover:bg-[#0061ff] disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
              <span>CSV/Excel Format</span>
            </button>
            
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isLoading || verifications.length === 0}
              className="bg-red-700 hover:bg-red-800 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>PDF Format Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
