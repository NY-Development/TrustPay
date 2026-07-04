import { VerifiedTransaction } from '@/src/types/verification';
import { VerificationSeverity } from '@/src/types/verification';

export interface SeverityResult {
  severity: VerificationSeverity;
  title: string;
  description: string;
  color: string;
  icon: string;
}

/**
 * Bank-grade severity engine
 */
export const computeVerificationSeverity = (
  tx: VerifiedTransaction,
  res: any
): SeverityResult => {
  const matched = tx.settlementAccountMatch?.matched;
  const confidence = tx.settlementAccountMatch?.matchConfidence;
  const confirmationCount = tx.confirmationHistory?.confirmationCount || 0;

  const isDuplicate =
    confirmationCount > 1 ||
    tx.confirmationHistory?.confirmedBefore === true;

  const isFraudRisk =
    matched === false &&
    confidence === 'none' &&
    tx.status === 'failed';

  const isWarning =
    matched === false && tx.status === 'success';

  const isSuccess =
    tx.verified === true && matched === true;

  /**
   * PRIORITY ORDER (VERY IMPORTANT)
   */
  if (isFraudRisk) {
    return {
      severity: 'fraud_risk',
      title: 'Fraud Risk Detected',
      description:
        'This transaction does not match any registered settlement account.',
      color: 'destructive',
      icon: 'warning',
    };
  }

  if (isDuplicate) {
    return {
      severity: 'duplicate',
      title: 'Duplicate Transaction',
      description:
        'This transaction has been confirmed before. Possible replay or duplicate scan.',
      color: 'warning',
      icon: 'copy',
    };
  }

  if (isWarning) {
    return {
      severity: 'warning',
      title: 'Unmatched Settlement Account',
      description:
        'Transaction is valid but does not match registered business accounts.',
      color: 'warning',
      icon: 'alert-circle',
    };
  }

  if (isSuccess) {
    return {
      severity: 'success',
      title: 'Payment Verified',
      description: 'Transaction is fully verified and matched.',
      color: 'primary',
      icon: 'checkmark-circle',
    };
  }

  return {
    severity: 'info',
    title: 'Verification Completed',
    description: 'Transaction processed successfully.',
    color: 'secondary',
    icon: 'information-circle',
  };
};