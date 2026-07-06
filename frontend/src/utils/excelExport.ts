import * as XLSX from 'xlsx';

interface ExportExcelOptions {
  /** The primary array of objects containing the data rows */
  data: Record<string, any>[];
  /** The default name for the downloaded spreadsheet file (without extension) */
  fileName?: string;
  /** The worksheet tab name inside the Excel workbook */
  sheetName?: string;
}

/**
 * Utility to export an array of JSON objects to an Excel spreadsheet
 * with automatic column width resizing based on content length.
 */
export const exportToExcel = ({
  data,
  fileName = 'Export',
  sheetName = 'Sheet1'
}: ExportExcelOptions): void => {
  if (!data || data.length === 0) {
    throw new Error('No data structure present to compile spreadsheet.');
  }

  // Convert JSON dataset map array explicitly into a SheetJS worksheet node
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // --- Dynamic Column Auto-Width Adjuster Logic ---
  const objectKeys = Object.keys(data[0]);
  const colWidths = objectKeys.map((key) => {
    // Start width matching the string length of the header key text itself
    let maxLen = key.length;

    // Iterate through every active row array index node to extract cell string limits
    data.forEach((row) => {
      const cellValue = row[key];
      if (cellValue !== undefined && cellValue !== null) {
        const currentLen = String(cellValue).length;
        if (currentLen > maxLen) {
          maxLen = currentLen;
        }
      }
    });

    // Return SheetJS character width structure with breathing room padding
    return { wch: maxLen + 3 };
  });

  // Assign computed column configurations array back into worksheet boundaries
  worksheet['!cols'] = colWidths;

  // Trigger browser binary telemetry payload delivery download
  XLSX.writeFile(workbook, `${fileName.replace(/\s+/g, '_')}.xlsx`);
};