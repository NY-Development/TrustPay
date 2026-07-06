import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}

export function exportToPDF(verifications: any[], dateFrom?: string, dateTo?: string) {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Add header title font & branding
  doc.setFontSize(18);
  doc.setTextColor(0, 75, 202); 
  doc.text('TrustPay Cashier Terminal Verification Audit Report', 14, 22);

  // Add filters details metadata descriptors
  doc.setFontSize(10);
  doc.setTextColor(80, 90, 110);
  let filterText = 'All historical verification transaction logs.';
  if (dateFrom && dateTo) {
    filterText = `Filter range: ${dateFrom} to ${dateTo}`;
  } else if (dateFrom) {
    filterText = `Filter range: From ${dateFrom}`;
  } else if (dateTo) {
    filterText = `Filter range: Up to ${dateTo}`;
  }
  doc.text(filterText, 14, 30);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

  // Build grid properties columns
  const tableColumn = [
    'Reference Num',
    'Amount',
    'Currency',
    'Provider',
    'Payer Name',
    'Status',
    'Date / Time'
  ];

  // Map rows
  const tableRows: any[][] = [];

  verifications.forEach(item => {
    const itemData = [
      item.referenceNumber || '-',
      item.amount || '0.00',
      item.currency || 'ETB',
      (item.provider || '').toUpperCase(),
      item.payerName || 'Unknown',
      item.status || item.verificationStatus || '-',
      new Date(item.createdAt).toLocaleString()
    ];
    tableRows.push(itemData);
  });

  // Draw grid table
  doc.autoTable({
    startY: 42,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [0, 75, 202] },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    styles: { fontSize: 8, font: 'helvetica' }
  });

  // Download PDF
  doc.save(`reconciliation_report_${Date.now()}.pdf`);
}
