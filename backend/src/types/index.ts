import { Types } from 'mongoose';
import { Role, Provider, VerificationSource } from '../constants';
export { Role, Provider, VerificationSource };

// ─── JWT ──────────────────────────────────────
export interface JwtAccessPayload {
  userId: string;
  email: string;
  role: Role;
  businessId?: string;
  branchId?: string;
}

export interface JwtRefreshPayload {
  userId: string;
  tokenVersion: number;
}

// ─── Request Extensions ───────────────────────
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  businessId?: string;
  branchId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      deviceInfo?: DeviceInfo;
    }
  }
}

// ─── Device Info ──────────────────────────────
export interface DeviceInfo {
  deviceId?: string;
  appVersion?: string;
  ipAddress: string;
  userAgent: string;
}

// ─── Verification ─────────────────────────────
// ─────────────────────────────────────────────
// Verification Engine Types
// ─────────────────────────────────────────────

export type VerificationStatus =
  | 'success'
  | 'failed'
  | 'pending';

export type MatchConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'none';

export interface SettlementAccountMatch {
  matched: boolean;

  matchType: string;

  matchConfidence: MatchConfidence;

  source: string;

  bank: Provider | string;

  receiverAccount: string;

  matchedUserBankAccountId?: string | null;

  matchedBusinessBankAccountId?: string | null;

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

    matchedUserBankAccountId?: string | null;

    matchedBusinessBankAccountId?: string | null;
  };
}

export interface ConfirmationHistory {
  scope: string;

  isFirstConfirmation: boolean;

  confirmedBefore: boolean;

  firstConfirmedAt: Date | string;

  lastConfirmedAt: Date | string;

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

  transactionDateIsoUtc: Date | string;

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
  bank: Provider | string;

  status: VerificationStatus;

  verified: boolean;

  senderName?: string;

  receiverName?: string;

  amount: number;

  currency: string;

  referenceNumber: string;

  accountSuffix: string;

  timestamp: Date | string;

  bankSpecific?: BankSpecific;

  confirmationHistory: ConfirmationHistory;

  settlementAccountMatch: SettlementAccountMatch;
}

export interface VerificationPayload {
  requestId: string;

  processingStatus: string;

  status: VerificationStatus;

  verified: boolean;

  result: VerifiedTransaction;
}

export interface VerificationEngineResponse {
  success: boolean;

  message: string;

  requestId: string;

  data: VerifiedTransaction[];

  verification: VerificationPayload;

  links?: {
    statusUrl: string;
  };
}

// export interface SettlementAccountMatch {
//   matched: boolean;
//   expected: string;
//   actual?: string;
// }

// export interface VerificationResult {
//   success: boolean;
//   verified: boolean;
//   provider: Provider | string;
//   transactionId: string;
//   referenceNumber?: string;
//   amount: number;
//   currency: string;
//   payerName: string;
//   paymentDate: Date | string;
//   receiverName?: string;
//   receiverAccount?: string;
//   settlementAccountMatch?: SettlementAccountMatch;
//   raw?: Record<string, unknown>;
// }

export interface OcrExtractionResult {
  transactionId?: string;
  referenceNumber?: string;
  amount?: number;
  provider?: string;
  payerName?: string;
  confidence: 'regex' | 'ai' | 'none';
}

// ─── API Responses ────────────────────────────
export interface ApiResponse<T = unknown> {
    success: boolean;

    message: string;

    data?: T;

    error?: string;

    requestId?: string;

    verification?: unknown;

    links?: {
        statusUrl: string;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
