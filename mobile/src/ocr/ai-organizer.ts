import { detectProvider } from '../utils/provider-detector';

/* =========================================================
   HEURISTIC EXTRACTOR FALLBACK (Offline & Local)
   ========================================================= */

export const runHeuristics = (text: string) => {
  console.log("[TrustPay Heuristics] Running local regex parser...");
  const lower = text.toLowerCase();

  // 1. Detect provider
  let bank = 'unknown';
  if (lower.includes('cbe') || lower.includes('commercial bank')) bank = 'cbe';
  else if (lower.includes('telebirr') || lower.includes('tele birr')) bank = 'telebirr';
  else if (lower.includes('abyssinia') || lower.includes('boa')) bank = 'boa';
  else if (lower.includes('dashen') || lower.includes('amole')) bank = 'dashen';
  else if (lower.includes('awash')) bank = 'awash';
  else if (lower.includes('siinqee')) bank = 'siinqee';
  else if (lower.includes('mpesa') || lower.includes('m-pesa')) bank = 'mpesa';
  else if (lower.includes('kaafi')) bank = 'kaafiebirr';

  // 2. Extract reference number
  let referenceNumber: string | null = null;
  const refMatches = text.match(/\b(FT[A-Z0-9]{8,15})|(0[0-9]{9})\b/i) || 
                     text.match(/\b(TXN[A-Z0-9]{8,15})\b/i) ||
                     text.match(/\b([A-Z0-9]{10,12})\b/);
  
  if (refMatches) {
    referenceNumber = refMatches[0].trim();
  }

  // 3. Extract amount
  let amount: number | null = null;
  const amountMatch = text.match(/[\d,]+\.\d{2}/) || text.match(/amount\s*:\s*([\d,]+)/i);
  if (amountMatch) {
    const rawVal = amountMatch[1] || amountMatch[0];
    const cleaned = parseFloat(rawVal.replace(/,/g, ''));
    if (!isNaN(cleaned)) amount = cleaned;
  }

  // 4. Provider detection fallback
  if (bank === 'unknown' && referenceNumber) {
    bank = detectProvider(referenceNumber);
  }

  return {
    bank,
    transactionNumber: referenceNumber,
    referenceNumber,
    receiptNumber: null,
    receiptUrl: null,
    accountSuffix: null,
    phoneNumber: null,
    amount,
    currency: "ETB",
    date: null,
    time: null,
    senderName: "Customer Scan",
    receiverName: "Merchant Wallet",
    merchant: null,
    paymentStatus: "completed",
    confidence: 0.5,
  };
};

/* =========================================================
   PRIMARY EXTRACTOR - Backward Compatibility Proxy
   ========================================================= */

export const organizeReceiptData = async (rawOcrText: string) => {
  // Direct calls fallback straight to heuristics immediately
  return runHeuristics(rawOcrText);
};