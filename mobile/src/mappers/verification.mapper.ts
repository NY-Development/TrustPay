import { VerificationResultPayload, VerifiedTransaction } from '@/src/types/verification';

export interface NormalizedVerification {
  success: boolean;
  message: string;

  transaction: VerifiedTransaction;

  meta: {
    requestId: string;
    processingStatus: string;
    verified: boolean;
  };

  ui: {
    title: string;
    type: 'success' | 'error' | 'warning';
    description: string;
  };

  settlement: {
    matched: boolean;
    confidence: string;
    reason: string;
  };
}

export const normalizeVerificationResponse = (
  res: VerificationResultPayload
): NormalizedVerification => {
  const tx =
    res?.verification?.result ||
    res?.data?.[0];

  if (!tx) {
    throw new Error('Invalid verification response: missing transaction');
  }

  const matched = tx.settlementAccountMatch?.matched ?? false;

  const uiType =
    res.success && tx.verified
      ? 'success'
      : matched
      ? 'warning'
      : 'error';

  return {
    success: res.success,
    message: res.message,

    transaction: tx,

    meta: {
      requestId: res.requestId,
      processingStatus: res.verification.processingStatus,
      verified: res.verification.verified,
    },

    ui: {
      title:
        uiType === 'success'
          ? 'Payment Verified'
          : uiType === 'warning'
          ? 'Partially Verified'
          : 'Verification Failed',

      type: uiType,

      description:
        tx.referenceNumber
          ? `Transaction ${tx.referenceNumber} processed`
          : 'Transaction processed',
    },

    settlement: {
      matched: matched,
      confidence: tx.settlementAccountMatch?.matchConfidence || 'none',
      reason: tx.settlementAccountMatch?.reason || 'unknown',
    },
  };
};