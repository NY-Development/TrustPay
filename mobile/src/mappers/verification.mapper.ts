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
  res: any
): NormalizedVerification => {
  let tx: VerifiedTransaction | undefined;

  // Check if res.data is a single DB VerificationRecord
  if (
    res?.data &&
    typeof res.data === 'object' &&
    !Array.isArray(res.data) &&
    (res.data._id || res.data.transactionId)
  ) {
    const dbRecord = res.data;
    tx = {
      bank: (dbRecord.provider || 'unknown') as any,
      // DB records have `verified`/`processingStatus`, never a plain `status`
      // field — derive the UI-facing success/failed/pending tri-state from
      // those real fields instead (this feeds fraud/warning classification
      // in verification-severity.ts, so getting it wrong silently disables
      // that detection for every history-sourced record).
      status: dbRecord.verified === true ? 'success' : dbRecord.processingStatus === 'failed' ? 'failed' : 'pending',
      verified: dbRecord.verified ?? true,
      senderName: dbRecord.senderName || dbRecord.verificationResult?.bankSpecific?.senderName,
      receiverName: dbRecord.receiverName || dbRecord.verificationResult?.bankSpecific?.receiverName,
      amount: dbRecord.amount || 0,
      currency: dbRecord.currency || 'ETB',
      referenceNumber: dbRecord.referenceNumber || dbRecord.transactionId || '',
      accountSuffix: dbRecord.receiverAccount ? dbRecord.receiverAccount.slice(-4) : '',
      timestamp: dbRecord.paymentDate || dbRecord.createdAt || '',
      settlementAccountMatch: dbRecord.rawResponse?.settlementAccountMatch || {
        matched: true,
        matchType: 'exact',
        matchConfidence: 'high',
        source: 'db',
        bank: dbRecord.provider || 'unknown',
        receiverAccount: dbRecord.receiverAccount || '',
        matchedUserBankAccountId: null,
        matchedBusinessBankAccountId: null,
        candidateCount: 1,
        ambiguous: false,
        reason: 'Successfully matched with settlement account',
      },
      confirmationHistory: dbRecord.rawResponse?.confirmationHistory || {
        scope: 'business',
        isFirstConfirmation: true,
        confirmedBefore: false,
        firstConfirmedAt: dbRecord.paymentDate || dbRecord.createdAt || '',
        lastConfirmedAt: dbRecord.paymentDate || dbRecord.createdAt || '',
        confirmationCount: 1,
      },
      bankSpecific: dbRecord.rawResponse?.bankSpecific || {
        senderName: dbRecord.payerName || 'Unknown',
        senderAccount: '',
        senderAccountLast4: '',
        receiverName: dbRecord.receiverName || 'Unknown',
        receiverAccount: dbRecord.receiverAccount || '',
        receiverAccountLast4: dbRecord.receiverAccount ? dbRecord.receiverAccount.slice(-4) : '',
        transactionDateRaw: dbRecord.paymentDate || dbRecord.createdAt || '',
        transactionDateIsoUtc: dbRecord.paymentDate || dbRecord.createdAt || '',
        amountValue: dbRecord.amount || 0,
        reference: dbRecord.referenceNumber || dbRecord.transactionId || '',
        branch: '',
        payerAccount: '',
        reason: '',
        dateRaw: '',
        amountRaw: String(dbRecord.amount || 0),
        serviceCharge: 0,
        serviceChargeRaw: '0',
        vatOnCommission: 0,
        vatOnCommissionRaw: '0',
        totalDebited: dbRecord.amount || 0,
        totalDebitedRaw: String(dbRecord.amount || 0),
        amountInWords: '',
        currency: dbRecord.currency || 'ETB',
        source: dbRecord.source || 'manual',
      },
    };
  } else {
    tx = res?.verification?.result || res?.data?.[0];
  }

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
      requestId: res.requestId || res.data?.requestId || '',
      processingStatus: res.verification?.processingStatus || (tx.verified ? 'completed' : 'pending'),
      verified: res.verification?.verified ?? tx.verified,
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