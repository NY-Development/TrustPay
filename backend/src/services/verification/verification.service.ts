import { verifyEtConfig } from '../../config/verifier';
import { logger } from '../../config/logger';
import { VerificationResult } from '../../types';

/**
 * Verify.ET API integration service
 * Replaces the old @creofam/verifier SDK with direct HTTP calls
 */
export class VerificationService {
  /**
   * Detect provider based on transaction reference pattern
   */
  static detectProvider(reference: string): string {
    const ref = reference.toUpperCase();

    if (ref.startsWith('FT') || /^FT\d+$/.test(ref)) return 'cbe';
    if (ref.startsWith('BOA') || /^BOA\d+$/.test(ref)) return 'boa';
    if (ref.startsWith('TELE') || ref.startsWith('DET')) return 'telebirr';
    if (ref.startsWith('MPESA') || ref.startsWith('MP')) return 'mpesa';
    if (ref.startsWith('CBE-BIRR') || ref.startsWith('CBEBIRR')) return 'cbebirr';
    if (ref.startsWith('DASHEN')) return 'dashen';
    if (ref.startsWith('AWASH')) return 'awash';
    if (ref.startsWith('SIINQEE')) return 'siinqee';
    if (ref.includes('ebirr.com') || ref.startsWith('KAAFI')) return 'kaafiebirr';

    return 'cbe'; // default
  }

  /**
   * Build bank-specific payload for Verify.ET POST /api/verify
   */
  private static buildPayload(params: {
    provider: string;
    reference: string;
    suffix?: string;
    accountSuffix?: string;
    receiptNumber?: string;
    phoneNumber?: string;
    settlementAccount?: string;
  }): Record<string, unknown> {
    const { provider, reference, suffix, accountSuffix, receiptNumber, phoneNumber, settlementAccount } = params;
    const bank = provider.toLowerCase();
    const payload: Record<string, unknown> = { bank };

    if (settlementAccount) {
      payload.settlementAccount = settlementAccount;
    }

    switch (bank) {
      case 'cbe':
        payload.referenceNumber = reference;
        payload.accountSuffix = accountSuffix || suffix || '';
        break;
      case 'boa':
        payload.referenceNumber = reference;
        payload.accountSuffix = accountSuffix || suffix || '';
        break;
      case 'telebirr':
        payload.transactionNumber = reference;
        break;
      case 'mpesa':
        payload.transactionNumber = reference || receiptNumber;
        break;
      case 'cbebirr':
        payload.receiptNumber = receiptNumber || reference;
        if (phoneNumber) payload.phone = phoneNumber;
        break;
      case 'dashen':
      case 'awash':
      case 'siinqee':
        payload.referenceNumber = reference;
        break;
      case 'kaafiebirr':
        payload.referenceNumber = reference;
        if (phoneNumber) payload.phone = phoneNumber;
        break;
      default:
        // Universal/smart-router payload
        payload.reference = reference;
        if (suffix || accountSuffix) payload.suffix = suffix || accountSuffix;
        if (phoneNumber) payload.phoneNumber = phoneNumber;
        break;
    }

    return payload;
  }

  /**
   * Submit a verification to Verify.ET and handle both 200 (completed) and 202 (queued → poll)
   */
  static async verifyWithProvider(params: {
    provider: string;
    reference: string;
    suffix?: string;
    accountSuffix?: string;
    receiptNumber?: string;
    phoneNumber?: string;
    settlementAccount?: string;
  }): Promise<VerificationResult> {
    const payload = this.buildPayload(params);

    try {
      const url = `${verifyEtConfig.baseUrl}/api/verify?waitMs=${verifyEtConfig.defaultWaitMs}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': verifyEtConfig.apiKey,
          'Idempotency-Key': `trustpay-${params.reference}-${Date.now()}`,
        },
        body: JSON.stringify(payload),
      });

      const body: any = await response.json();

      // Handle errors
      if (!response.ok && response.status !== 202) {
        logger.error('Verify.ET API Error:', { status: response.status, body });
        return this.failedResult(params.provider, params.reference, body);
      }

      // 200 — completed immediately
      if (response.status === 200) {
        return this.mapCompletedResponse(body, params.provider, params.reference, params.settlementAccount);
      }

      // 202 — queued, need to poll
      if (response.status === 202) {
        const statusUrl = body.links?.statusUrl || body.statusUrl;
        if (!statusUrl) {
          logger.error('Verify.ET 202 response missing statusUrl', body);
          return this.failedResult(params.provider, params.reference, body);
        }

        const fullStatusUrl = statusUrl.startsWith('http')
          ? statusUrl
          : `${verifyEtConfig.baseUrl}${statusUrl}`;

        return await this.pollForResult(fullStatusUrl, params.provider, params.reference, params.settlementAccount);
      }

      return this.failedResult(params.provider, params.reference, body);
    } catch (error: any) {
      logger.error('Verify.ET Request Error:', error);
      return this.failedResult(params.provider, params.reference, { error: error.message });
    }
  }

  /**
   * Helper to verify if settlement accounts match (suffix matching)
   */
  private static matchAccounts(expected?: string, actual?: string): boolean {
    if (!expected || !actual) return false;
    const cleanExpected = expected.replace(/\D/g, '');
    const cleanActual = actual.replace(/\D/g, '');
    if (!cleanExpected || !cleanActual) return false;
    return cleanExpected.endsWith(cleanActual) || cleanActual.endsWith(cleanExpected);
  }

  /**
   * Poll GET /api/verify/:requestId until completed or failed
   */
  private static async pollForResult(
    statusUrl: string,
    provider: string,
    reference: string,
    settlementAccount?: string
  ): Promise<VerificationResult> {
    const { maxPollAttempts, defaultPollIntervalMs } = verifyEtConfig;

    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      const response = await fetch(statusUrl, {
        headers: { 'x-api-key': verifyEtConfig.apiKey },
      });
      const body: any = await response.json();
      const status = body.data?.processingStatus;

      if (status === 'completed') {
        return this.mapPolledResponse(body, provider, reference, settlementAccount);
      }

      if (status === 'failed') {
        logger.warn('Verify.ET verification failed during polling', body.data);
        return this.failedResult(provider, reference, body.data);
      }

      const waitMs = body.links?.pollAfterMs ?? defaultPollIntervalMs;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    logger.error('Verify.ET polling timeout', { statusUrl, maxPollAttempts });
    return this.failedResult(provider, reference, { error: 'Polling timeout' });
  }

  /**
   * Helper to perform a robust, case-insensitive, deep search for a set of keys in any object.
   */
  private static findValueInObject(obj: any, keys: string[]): any {
    if (!obj || typeof obj !== 'object') return undefined;

    const lowerKeys = keys.map(k => k.toLowerCase());

    // 1. Direct search (case-insensitive)
    for (const [k, v] of Object.entries(obj)) {
      if (lowerKeys.includes(k.toLowerCase()) && v !== undefined && v !== null && v !== '') {
        return v;
      }
    }

    // 2. Prioritized sub-object search
    const prioritisedProperties = ['data', 'verification', 'raw'];
    for (const prop of prioritisedProperties) {
      if (obj[prop]) {
        const val = this.findValueInObject(obj[prop], keys);
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
      }
    }

    // 3. Fallback check for arrays/objects
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const val = this.findValueInObject(item, keys);
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
      }
    }

    for (const [k, v] of Object.entries(obj)) {
      if (prioritisedProperties.includes(k)) continue;
      if (v && typeof v === 'object') {
        const val = this.findValueInObject(v, keys);
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
      }
    }

    return undefined;
  }

  /**
   * Map a completed 200 response to VerificationResult
   */
  private static mapCompletedResponse(
    body: any,
    provider: string,
    reference: string,
    settlementAccount?: string
  ): VerificationResult {
    const resultData = Array.isArray(body.data) ? body.data[0] : body.data;
    const verified = this.findValueInObject(resultData, ['verified']) ?? false;
    const amount = Number(this.findValueInObject(resultData, ['amount', 'settledAmount', 'totalPaidAmount', 'amountExpected', 'value'])) || 0;
    const currency = this.findValueInObject(resultData, ['currency', 'curr', 'currencyCode']) || 'ETB';
    const payerName = this.findValueInObject(resultData, ['senderName', 'payerName', 'sender', 'payer', 'sender_name', 'payer_name']) || 'Unknown';
    const receiverName = this.findValueInObject(resultData, ['receiverName', 'receiver', 'recipientName', 'recipient', 'creditedPartyName', 'merchantName', 'payee', 'receiver_name', 'recipient_name']);
    const receiverAccount = this.findValueInObject(resultData, ['receiverAccount', 'receiver_account', 'receiverNo', 'receiverNumber', 'creditedPartyAccountNo', 'account', 'accountNo', 'accountNumber']);
    const rawTimestamp = this.findValueInObject(resultData, ['timestamp', 'completedAt', 'paymentDate', 'date', 'txnDate', 'created_at']);
    const paymentDate = rawTimestamp ? new Date(rawTimestamp) : new Date();

    return {
      success: true,
      verified: verified === true || String(verified).toLowerCase() === 'true',
      provider: this.findValueInObject(resultData, ['bank', 'provider', 'type']) || provider,
      transactionId: this.findValueInObject(resultData, ['referenceNumber', 'transactionId', 'transactionNumber', 'reference', 'txnId']) || reference,
      referenceNumber: this.findValueInObject(resultData, ['referenceNumber']),
      amount,
      currency,
      payerName,
      paymentDate,
      receiverName,
      receiverAccount,
      settlementAccountMatch: settlementAccount ? {
        matched: this.matchAccounts(settlementAccount, receiverAccount),
        expected: settlementAccount,
        actual: receiverAccount,
      } : undefined,
      raw: body,
    };
  }

  /**
   * Map a polled status response to VerificationResult
   */
  private static mapPolledResponse(
    body: any,
    provider: string,
    reference: string,
    settlementAccount?: string
  ): VerificationResult {
    const resultData = Array.isArray(body.data) ? body.data[0] : body.data;
    const verified = this.findValueInObject(resultData, ['verified']) ?? false;
    const amount = Number(this.findValueInObject(resultData, ['amount', 'settledAmount', 'totalPaidAmount', 'amountExpected', 'value'])) || 0;
    const currency = this.findValueInObject(resultData, ['currency', 'curr', 'currencyCode']) || 'ETB';
    const payerName = this.findValueInObject(resultData, ['senderName', 'payerName', 'sender', 'payer', 'sender_name', 'payer_name']) || 'Unknown';
    const receiverName = this.findValueInObject(resultData, ['receiverName', 'receiver', 'recipientName', 'recipient', 'creditedPartyName', 'merchantName', 'payee', 'receiver_name', 'recipient_name']);
    const receiverAccount = this.findValueInObject(resultData, ['receiverAccount', 'receiver_account', 'receiverNo', 'receiverNumber', 'creditedPartyAccountNo', 'account', 'accountNo', 'accountNumber']);
    const rawTimestamp = this.findValueInObject(resultData, ['timestamp', 'completedAt', 'paymentDate', 'date', 'txnDate', 'created_at']);
    const paymentDate = rawTimestamp ? new Date(rawTimestamp) : new Date();

    const statusValue = this.findValueInObject(resultData, ['status', 'processingStatus']);
    const isSuccess = statusValue === 'success' || statusValue === 'completed' || verified === true;

    return {
      success: isSuccess,
      verified: verified === true || String(verified).toLowerCase() === 'true',
      provider: this.findValueInObject(resultData, ['bank', 'provider', 'type']) || provider,
      transactionId: this.findValueInObject(resultData, ['referenceNumber', 'transactionId', 'transactionNumber', 'reference', 'txnId']) || reference,
      referenceNumber: this.findValueInObject(resultData, ['referenceNumber']),
      amount,
      currency,
      payerName,
      paymentDate,
      receiverName,
      receiverAccount,
      settlementAccountMatch: settlementAccount ? {
        matched: this.matchAccounts(settlementAccount, receiverAccount),
        expected: settlementAccount,
        actual: receiverAccount,
      } : undefined,
      raw: body,
    };
  }

  /**
   * Build a failed VerificationResult
   */
  private static failedResult(
    provider: string,
    reference: string,
    raw: any
  ): VerificationResult {
    return {
      success: false,
      verified: false,
      provider,
      transactionId: reference,
      amount: 0,
      currency: 'ETB',
      payerName: 'N/A',
      paymentDate: new Date(),
      raw,
    };
  }
}
