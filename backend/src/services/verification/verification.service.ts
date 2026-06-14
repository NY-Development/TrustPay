import { verifierClient } from '../../config/verifier';
import { Verification } from '../../models/Verification';
import { logger } from '../../config/logger';
import { 
  VerificationResult, 
  Provider,
  ApiResponse
} from '../../types';

/**
 * Service to handle payment verification logic using @creofam/verifier SDK
 */
export class VerificationService {
  /**
   * Detect provider based on transaction reference pattern
   * (If user didn't specify or for universal verification)
   */
  static detectProvider(reference: string): string {
    const ref = reference.toUpperCase();
    
    if (ref.startsWith('TXN') || /^[A-Z0-9]{8,15}$/.test(ref)) {
      return 'telebirr';
    }
    if (/^[0-9]{10,}$/.test(ref)) {
      return 'cbe';
    }
    return 'generic';
  }

  /**
   * Verify using provider-specific method
   */
  static async verifyWithProvider(params: {
    provider: string;
    reference: string;
    suffix?: string;
    accountSuffix?: string;
    receiptNumber?: string;
  }): Promise<VerificationResult> {
    const { provider, reference, suffix, accountSuffix, receiptNumber } = params;
    const queryRef = reference || receiptNumber || '';

    try {
      let sdkResult: any;

      switch (provider.toLowerCase()) {
        case 'telebirr':
          sdkResult = await verifierClient.verifyTelebirr({ reference: queryRef }, { mode: 'both' });
          break;
        case 'cbe':
          if (!accountSuffix) throw new Error('CBE requires accountSuffix');
          sdkResult = await verifierClient.verifyCBE({ reference: queryRef, accountSuffix }, { mode: 'both' });
          break;
        case 'abyssinia':
          if (!suffix) throw new Error('Abyssinia requires suffix');
          sdkResult = await verifierClient.verifyAbyssinia({ reference: queryRef, suffix }, { mode: 'both' });
          break;
        case 'mpesa':
          sdkResult = await verifierClient.verifyMpesa({ receiptNumber: queryRef }, { mode: 'both' });
          break;
        default:
          // Fallback to universal
          sdkResult = await verifierClient.verifyUniversal({ reference: queryRef }, { mode: 'both' });
      }

      return {
        success: sdkResult.ok,
        verified: sdkResult.ok,
        provider: sdkResult.provider || provider,
        transactionId: sdkResult.data?.reference || queryRef,
        referenceNumber: sdkResult.data?.reference,
        amount: Number(sdkResult.data?.amount) || 0,
        currency: sdkResult.data?.currency || 'ETB',
        payerName: sdkResult.data?.payerName || 'Anonymous',
        paymentDate: sdkResult.data?.txnDate ? new Date(sdkResult.data.txnDate) : new Date(),
        receiverName: sdkResult.data?.receiverAccount,
        raw: sdkResult.raw,
      };
    } catch (error: any) {
      logger.error('SDK Verification Error:', error);
      return {
        success: false,
        verified: false,
        provider,
        transactionId: queryRef,
        amount: 0,
        currency: 'ETB',
        payerName: 'N/A',
        paymentDate: new Date(),
        raw: { error: error.message },
      };
    }
  }

  /**
   * Universal verification (let SDK decide)
   */
  static async verifyUniversal(params: {
    reference: string;
    suffix?: string;
    phoneNumber?: string;
  }): Promise<VerificationResult> {
    try {
      const sdkResult = await verifierClient.verifyUniversal(params, { mode: 'both' });

      return {
        success: (sdkResult as any).ok,
        verified: (sdkResult as any).ok,
        provider: (sdkResult as any).provider || 'universal',
        transactionId: (sdkResult as any).data?.reference || params.reference,
        amount: Number((sdkResult as any).data?.amount) || 0,
        currency: (sdkResult as any).data?.currency || 'ETB',
        payerName: (sdkResult as any).data?.payerName || 'Anonymous',
        paymentDate: (sdkResult as any).data?.txnDate ? new Date((sdkResult as any).data.txnDate) : new Date(),
        raw: (sdkResult as any).raw,
      };
    } catch (error: any) {
      logger.error('SDK Universal Error:', error);
      throw error;
    }
  }
}
