import { verifyEtConfig } from '../../config/verifier';
import { logger } from '../../config/logger';
import { VerifiedTransaction, SettlementAccountMatch, ConfirmationHistory, BankSpecific } from '../../types';

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
  }): Promise<VerifiedTransaction> {
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
        return this.mapApiResponse(body, params.provider, params.reference);
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

        return await this.pollForResult(fullStatusUrl, params.provider, params.reference);
      }

      return this.failedResult(params.provider, params.reference, body);
    } catch (error: any) {
      logger.error('Verify.ET Request Error:', error);
      return this.failedResult(params.provider, params.reference, { error: error.message });
    }
  }

  /**
   * Poll GET /api/verify/:requestId until completed or failed
   */
  private static async pollForResult(
    statusUrl: string,
    provider: string,
    reference: string
  ): Promise<VerifiedTransaction> {
    const { maxPollAttempts, defaultPollIntervalMs } = verifyEtConfig;

    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      const response = await fetch(statusUrl, {
        headers: { 'x-api-key': verifyEtConfig.apiKey },
      });
      const body: any = await response.json();
      const processingStatus = body.data?.processingStatus || body.verification?.processingStatus;

      if (processingStatus === 'completed') {
        // Re-fetch the full verification to get data[] with all fields
        return this.mapApiResponse(body, provider, reference);
      }

      if (processingStatus === 'failed') {
        logger.warn('Verify.ET verification failed during polling', body);
        return this.failedResult(provider, reference, body);
      }

      const waitMs = body.links?.pollAfterMs ?? defaultPollIntervalMs;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    logger.error('Verify.ET polling timeout', { statusUrl, maxPollAttempts });
    return this.failedResult(provider, reference, { error: 'Polling timeout' });
  }

  /**
   * Map any Verify.ET response (200 completed or polled completed) to VerifiedTransaction.
   *
   * The API returns: { success, message, data: [...], verification: {...}, links: {...} }
   * We extract data[0] as the primary result item.
   */
  private static mapApiResponse(
    body: any,
    fallbackProvider: string,
    fallbackReference: string,
  ): VerifiedTransaction {
    // Extract the first data item — this is the verified transaction
    const dataItem = Array.isArray(body.data) && body.data.length > 0
      ? body.data[0]
      : (body.verification?.result || body.data || {});

    // Direct field extraction from the API data item
    const bank = dataItem.bank || fallbackProvider;
    const status = dataItem.status || body.verification?.status || 'failed';
    const verified = dataItem.verified === true;
    const senderName = dataItem.senderName || 'Unknown';
    const receiverName = dataItem.receiverName || undefined;
    const amount = Number(dataItem.amount) || 0;
    const currency = dataItem.currency || dataItem.bankSpecific?.currency || 'ETB';
    const referenceNumber = dataItem.referenceNumber || fallbackReference;
    const accountSuffix = dataItem.accountSuffix || undefined;
    const timestamp = dataItem.timestamp
      ? new Date(dataItem.timestamp)
      : new Date();

    // Extract nested objects directly from API response
    const bankSpecific: BankSpecific | undefined = dataItem.bankSpecific || undefined;
    const confirmationHistory: ConfirmationHistory | undefined = dataItem.confirmationHistory || undefined;
    const settlementAccountMatch: SettlementAccountMatch | undefined = dataItem.settlementAccountMatch || undefined;

    // Receiver account — try bankSpecific first, then top-level
    const receiverAccount = dataItem.receiverAccount
      || bankSpecific?.receiverAccount
      || settlementAccountMatch?.receiverAccount
      || undefined;

    return {
      success: body.success === true && verified,
      bank,
      status,
      verified,
      senderName,
      receiverName,
      amount,
      currency,
      referenceNumber,
      accountSuffix,
      timestamp,
      bankSpecific,
      confirmationHistory,
      settlementAccountMatch,
      raw: body,
    };
  }

  /**
   * Build a failed VerifiedTransaction for error cases
   */
  private static failedResult(
    provider: string,
    reference: string,
    raw: any
  ): VerifiedTransaction {
    return {
      success: false,
      bank: provider,
      status: 'failed',
      verified: false,
      senderName: 'N/A',
      amount: 0,
      currency: 'ETB',
      referenceNumber: reference,
      timestamp: new Date(),
      raw,
    };
  }
}
