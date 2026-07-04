export type VerificationStatus =
  | 'success'
  | 'failed'
  | 'pending';

export type BankType =
  | 'cbe'
  | 'boa'
  | 'telebirr'
  | 'cbebirr'
  | 'mpesa'
  | 'dashen'
  | 'awash'
  | 'siinqee'
  | 'kaafiebirr'
  | 'unknown';

export interface SettlementAccountMatch {
  matched: boolean;
  matchType: string;
  matchConfidence: 'high' | 'medium' | 'low' | 'none' | string;
  source: string;
  bank: BankType;
  receiverAccount: string;

  matchedUserBankAccountId: string | null;
  matchedBusinessBankAccountId: string | null;

  candidateCount: number;
  ambiguous: boolean;
  reason: string;

  debug?: {
    receiverAccount: string;
    candidateCount: number;
    matchType: string;
    visiblePrefix: string;
    visibleSuffix: string;
    visibleCharacterCount: number;
    matchedUserBankAccountId: string | null;
    matchedBusinessBankAccountId: string | null;
  };
}

export interface ConfirmationHistory {
  scope: string;
  isFirstConfirmation: boolean;
  confirmedBefore: boolean;
  firstConfirmedAt: string;
  lastConfirmedAt: string;
  confirmationCount: number;
}

export interface BankSpecific {
  senderName: string;
  senderAccount: string;
  senderAccountLast4: string;

  receiverName: string;
  receiverAccount: string;
  receiverAccountLast4: string;

  transactionDateRaw: string;
  transactionDateIsoUtc: string;

  amountValue: number;

  reference: string;

  branch: string;
  payerAccount: string;

  reason: string;

  dateRaw: string;
  amountRaw: string;

  serviceCharge: number;
  serviceChargeRaw: string;

  vatOnCommission: number;
  vatOnCommissionRaw: string;

  totalDebited: number;
  totalDebitedRaw: string;

  amountInWords: string;
  currency: string;

  source: string;
}

export interface VerifiedTransaction {
  bank: BankType;
  status: VerificationStatus;
  verified: boolean;

  senderName?: string;
  receiverName?: string;

  amount: number;
  currency: string;

  referenceNumber: string;
  accountSuffix: string;

  timestamp: string;

  bankSpecific?: BankSpecific;
  confirmationHistory: ConfirmationHistory;
  settlementAccountMatch: SettlementAccountMatch;
}

export interface VerificationResultPayload {
  success: boolean;
  message: string;

  data: VerifiedTransaction[];

  requestId: string;

  verification: {
    requestId: string;
    processingStatus: string;
    status: VerificationStatus;
    verified: boolean;

    result: VerifiedTransaction;
  };

  links?: {
    statusUrl: string;
  };
}