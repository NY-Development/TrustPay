import {
  VerificationResultPayload,
  VerifiedTransaction,
} from '@/src/types/verification';

import { computeVerificationSeverity } from '@/src/utils/verification-severity';

/* =========================================================
   NORMALIZED CORE STRUCTURE
========================================================= */

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
    type: 'success' | 'error' | 'warning' | 'info';
    description: string;
  };

  settlement: {
    matched: boolean;
    confidence: string;
    reason: string;
  };

  severity: {
    severity: 'success' | 'info' | 'warning' | 'fraud_risk' | 'duplicate' | 'error';
    title: string;
    description: string;
    color: string;
    icon: string;
  };
}

/* =========================================================
   MAPPER
========================================================= */

export const normalizeVerificationResponse = (
  res: VerificationResultPayload
): NormalizedVerification => {
  const tx: VerifiedTransaction =
    res?.verification?.result ||
    res?.data?.[0];

  if (!tx) {
    throw new Error(
      'Invalid verification response: missing transaction object'
    );
  }

  const matched = tx.settlementAccountMatch?.matched ?? false;

  /* =========================================================
     BASIC UI TYPE (LIGHTWEIGHT DECISION)
  ========================================================= */

  const uiType: 'success' | 'warning' | 'error' =
    res.success && tx.verified
      ? 'success'
      : matched
      ? 'warning'
      : 'error';

  /* =========================================================
     SEVERITY ENGINE (FULL LOGIC)
  ========================================================= */

  const severity = computeVerificationSeverity(tx, res);

  /* =========================================================
     UI MAPPING (FRONTEND FRIENDLY)
  ========================================================= */

  const uiTitleMap: Record<string, string> = {
    success: 'Payment Verified',
    warning: 'Partially Verified',
    error: 'Verification Failed',
    info: 'Verification Completed',
    fraud_risk: 'Fraud Risk Detected',
    duplicate: 'Duplicate Transaction',
  };

  const uiDescription =
    tx.referenceNumber
      ? `Transaction ${tx.referenceNumber} processed`
      : 'Transaction processed';

  /* =========================================================
     FINAL RETURN
  ========================================================= */

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
      title: uiTitleMap[severity.severity] || uiTitleMap[uiType],
      type:
        severity.severity === 'fraud_risk' ||
        severity.severity === 'duplicate'
          ? 'error'
          : uiType,

      description: uiDescription,
    },

    settlement: {
      matched,
      confidence:
        tx.settlementAccountMatch?.matchConfidence || 'none',
      reason:
        tx.settlementAccountMatch?.reason || 'unknown',
    },

    severity,
  };
};