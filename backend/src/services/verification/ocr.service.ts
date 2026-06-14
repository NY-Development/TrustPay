import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { OcrExtractionResult } from '../../types';

/**
 * Service to process raw OCR text using Regex patterns
 * (AI fallback removed to reduce latency and cost as OCR is now handled on-device)
 */
export class OcrService {
  // Regex definitions for major Ethiopian payment providers
  private static REGEX_PATTERNS = {
    TELEBIRR: /(?:TXN|Transaction)\s*[:#]?\s*([A-Z0-9]{8,30})/i,
    REFERENCE: /(?:Reference|Ref)\s*[:#]?\s*([A-Z0-9]{6,30})/i,
    GENERIC_TXN: /(?:Transaction ID|Txn ID)\s*[:#]?\s*([A-Z0-9\-]{6,40})/i,
    AMOUNT: /(?:Amount|Amt)\s*[:#]?\s*(?:ETB|BIRR)?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    CBE: /CBE\s*BIRR/i,
    ABYSSINIA: /ABYSSINIA/i,
  };

  static async extract(text: string): Promise<OcrExtractionResult> {
    // 1. Detect provider
    let provider: string | undefined;
    if (this.REGEX_PATTERNS.TELEBIRR.test(text)) provider = 'telebirr';
    else if (this.REGEX_PATTERNS.CBE.test(text)) provider = 'cbe';
    else if (this.REGEX_PATTERNS.ABYSSINIA.test(text)) provider = 'abyssinia';

    // 2. Try Regex Matching for Transaction ID
    const telebirrMatch = text.match(this.REGEX_PATTERNS.TELEBIRR);
    const genericMatch = text.match(this.REGEX_PATTERNS.GENERIC_TXN);
    const refMatch = text.match(this.REGEX_PATTERNS.REFERENCE);
    const amountMatch = text.match(this.REGEX_PATTERNS.AMOUNT);

    const transactionId = telebirrMatch?.[1] || genericMatch?.[1];
    const referenceNumber = refMatch?.[1];
    
    let amount: number | undefined;
    if (amountMatch?.[1]) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    return {
      transactionId,
      referenceNumber,
      amount,
      provider,
      confidence: transactionId ? 'regex' : 'none',
    };
  }
}
