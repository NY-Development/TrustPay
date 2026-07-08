/**
 * Receipt Parser — Zod-Validated Receipt Extraction
 *
 * Parses raw LLM output into validated ReceiptData.
 * Normalizes fields and falls back to heuristics on failure.
 */
import { ReceiptDataSchema, type ValidatedReceiptData } from '../types/receipt.types';
import { safeParseJson } from './json-repair';
import { normalizeDate, normalizeCurrency, normalizeMerchant } from '../utils/response-normalizer';

export function parseReceiptResponse(raw: string, ocrText: string): ValidatedReceiptData {
  const parsed = safeParseJson<Record<string, unknown>>(raw);
  if (!parsed) return heuristicReceipt(ocrText);

  // Normalize before validation
  if (parsed.date && typeof parsed.date === 'string') {
    parsed.date = normalizeDate(parsed.date);
  }
  if (parsed.currency && typeof parsed.currency === 'string') {
    parsed.currency = normalizeCurrency(parsed.currency);
  }
  if (parsed.merchant && typeof parsed.merchant === 'string') {
    parsed.merchant = normalizeMerchant(parsed.merchant);
  }

  const result = ReceiptDataSchema.safeParse(parsed);
  if (result.success) return result.data;

  // Partial success: fill missing with defaults
  return ReceiptDataSchema.parse({
    ...heuristicReceipt(ocrText),
    ...parsed,
  });
}

function heuristicReceipt(text: string): ValidatedReceiptData {
  const lower = text.toLowerCase();
  let bank = 'unknown';
  if (lower.includes('cbe') || lower.includes('commercial bank')) bank = 'cbe';
  else if (lower.includes('telebirr')) bank = 'telebirr';
  else if (lower.includes('boa') || lower.includes('abyssinia')) bank = 'boa';
  else if (lower.includes('dashen')) bank = 'dashen';
  else if (lower.includes('awash')) bank = 'awash';

  let total: number | null = null;
  const amtMatch = text.match(/[\d,]+\.\d{2}/) || text.match(/amount\s*:\s*([\d,]+)/i);
  if (amtMatch) {
    const raw = amtMatch[1] || amtMatch[0];
    total = parseFloat(raw.replace(/,/g, '')) || null;
  }

  let referenceNumber: string | null = null;
  const refMatch = text.match(/\b(FT[A-Z0-9]{8,15})\b/i) || text.match(/\b([A-Z0-9]{10,12})\b/);
  if (refMatch) referenceNumber = refMatch[0].trim();

  return {
    merchant: null, date: new Date().toISOString().split('T')[0],
    subtotal: total ? +(total * 0.85).toFixed(2) : null,
    tax: total ? +(total * 0.15).toFixed(2) : null,
    vat: null, total, currency: 'ETB', paymentMethod: 'transfer',
    items: [], category: 'other', confidence: 0.4,
    referenceNumber, transactionNumber: referenceNumber, bank,
    senderName: null, receiverName: null,
  };
}
