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
        return this.mapCompletedResponse(body, params.provider, params.reference);
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
   * Universal verification (let Verify.ET smart-router decide the bank)
   */
  static async verifyUniversal(params: {
    reference: string;
    suffix?: string;
    phoneNumber?: string;
    settlementAccount?: string;
  }): Promise<VerificationResult> {
    return this.verifyWithProvider({
      provider: 'universal',
      reference: params.reference,
      suffix: params.suffix,
      phoneNumber: params.phoneNumber,
      settlementAccount: params.settlementAccount,
    });
  }

  /**
   * Poll GET /api/verify/:requestId until completed or failed
   */
  private static async pollForResult(
    statusUrl: string,
    provider: string,
    reference: string
  ): Promise<VerificationResult> {
    const { maxPollAttempts, defaultPollIntervalMs } = verifyEtConfig;

    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      const response = await fetch(statusUrl, {
        headers: { 'x-api-key': verifyEtConfig.apiKey },
      });
      const body: any = await response.json();
      const status = body.data?.processingStatus;

      if (status === 'completed') {
        return this.mapPolledResponse(body.data, provider, reference);
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
   * Map a completed 200 response to VerificationResult
   */
  private static mapCompletedResponse(
    body: any,
    provider: string,
    reference: string
  ): VerificationResult {
    const item = body.data?.[0] || {};
    const verification = body.verification || {};

    return {
      success: true,
      verified: verification.verified ?? item.verified ?? false,
      provider: item.bank || verification.bank || provider,
      transactionId: item.referenceNumber || item.transactionNumber || reference,
      referenceNumber: item.referenceNumber,
      amount: Number(item.amount) || Number(verification.amount) || 0,
      currency: item.currency || 'ETB',
      payerName: item.senderName || 'Unknown',
      paymentDate: item.timestamp ? new Date(item.timestamp) : new Date(),
      receiverName: item.receiverName,
      receiverAccount: item.receiverAccount,
      raw: body,
    };
  }

  /**
   * Map a polled status response to VerificationResult
   */
  private static mapPolledResponse(
    data: any,
    provider: string,
    reference: string
  ): VerificationResult {
    return {
      success: data.status === 'success',
      verified: data.verified ?? false,
      provider: data.bank || provider,
      transactionId: data.referenceNumber || data.transactionNumber || reference,
      referenceNumber: data.referenceNumber,
      amount: Number(data.amount) || Number(data.verification?.amount) || 0,
      currency: data.currency || 'ETB',
      payerName: data.senderName || 'Unknown',
      paymentDate: data.completedAt ? new Date(data.completedAt) : new Date(),
      receiverName: data.receiverName,
      receiverAccount: data.receiverAccount,
      raw: data,
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
