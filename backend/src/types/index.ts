import { Types } from 'mongoose';
import { Role, Provider, VerificationSource, OwnerStatus, CompanyType, MessageType, NotificationCategory } from '../constants';
export { Role, Provider, VerificationSource, OwnerStatus, CompanyType, MessageType, NotificationCategory };

// ─── JWT ──────────────────────────────────────
export interface JwtAccessPayload {
  userId: string;
  email: string;
  role: Role;
  actorType: 'owner' | 'employee';
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
  actorType: 'owner' | 'employee';
  branchId?: string;
  ownerId?: string; // Links employee to owner
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

// ─────────────────────────────────────────────
// Verify.ET API Response Types
// Aligned with the canonical Verify.ET API contract
// ─────────────────────────────────────────────

export type VerificationStatus = 'success' | 'failed' | 'pending';

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';

/**
 * Verify.ET `settlementAccountMatch` object from data[].settlementAccountMatch
 */
export interface SettlementAccountMatch {
  matched: boolean;
  matchType: string;
  matchConfidence: MatchConfidence;
  source: string;
  bank: Provider | string;
  receiverAccount?: string | null;
  matchedSettlementAccount?: string | null;
  matchedUserBankAccountId?: string | null;
  matchedBusinessBankAccountId?: string | null;
  candidateCount: number;
  ambiguous: boolean;
  reason: string;
  debug?: {
    receiverAccount?: string;
    candidateCount?: number;
    matchType?: string;
    visiblePrefix?: string;
    visibleSuffix?: string;
    visibleCharacterCount?: number;
    matchedUserBankAccountId?: string | null;
    matchedBusinessBankAccountId?: string | null;
  };
}

/**
 * Verify.ET `confirmationHistory` object from data[].confirmationHistory
 */
export interface ConfirmationHistory {
  scope: string;
  isFirstConfirmation: boolean;
  confirmedBefore: boolean;
  firstConfirmedAt: Date | string;
  lastConfirmedAt: Date | string;
  confirmationCount: number;
}

/**
 * Verify.ET `bankSpecific` object from data[].bankSpecific
 * Fields vary by bank — use partial/any for non-critical fields
 */
export interface BankSpecific {
  senderName?: string;
  senderAccount?: string;
  senderAccountLast4?: string;
  receiverName?: string;
  receiverAccount?: string;
  receiverAccountLast4?: string;
  transactionDateRaw?: string;
  transactionDateIsoUtc?: Date | string;
  amountValue?: number;
  reference?: string;
  branch?: string;
  payerAccount?: string;
  reason?: string;
  dateRaw?: string;
  amountRaw?: string;
  serviceCharge?: number;
  serviceChargeRaw?: string;
  vatOnCommission?: number;
  vatOnCommissionRaw?: string;
  totalDebited?: number;
  totalDebitedRaw?: string;
  amountInWords?: string;
  currency?: string;
  source?: string;
  [key: string]: unknown; // Allow bank-specific extra fields
}

/**
 * Internal unified result type returned by VerificationService.
 *
 * Maps Verify.ET's `data[0]` item with added service-computed fields.
 * Used by verification controller AND subscription service.
 *
 * API-native fields: bank, status, verified, senderName, receiverName, amount,
 *   currency, referenceNumber, accountSuffix, timestamp, bankSpecific,
 *   confirmationHistory, settlementAccountMatch
 *
 * Service-computed: success (did we consider it verified?), raw (full response body)
 */
export interface VerifiedTransaction {
  // ── Service-computed ──
  /** Whether TrustPay considers this a successful verification */
  success: boolean;

  // ── API-native fields from data[0] ──
  /** Bank provider code from Verify.ET (e.g. 'cbe', 'telebirr') */
  bank: Provider | string;

  /** Verification status from Verify.ET ('success' | 'failed' | 'pending') */
  status: VerificationStatus;

  /** Whether the transaction was verified by Verify.ET */
  verified: boolean;

  /** Sender/Payer name */
  senderName: string;

  /** Receiver name */
  receiverName?: string;

  /** Transaction amount */
  amount: number;

  /** Currency code (usually 'ETB') */
  currency: string;

  /** Transaction reference number */
  referenceNumber: string;

  /** Account suffix used for matching */
  accountSuffix?: string;

  /** Transaction timestamp from Verify.ET */
  timestamp: Date | string;

  /** Bank-specific extra fields (varies by bank) */
  bankSpecific?: BankSpecific;

  /** Confirmation history from Verify.ET */
  confirmationHistory?: ConfirmationHistory;

  /** Settlement account match result from Verify.ET */
  settlementAccountMatch?: SettlementAccountMatch;

  /** Full raw API response body for audit/debugging */
  raw?: any;
}

/**
 * Verify.ET envelope `verification` object
 */
export interface VerificationPayload {
  requestId: string;
  processingStatus: string;
  status: VerificationStatus;
  verified: boolean;
  result?: VerifiedTransaction;
}

/**
 * Full Verify.ET POST /api/verify response envelope
 */
export interface VerificationEngineResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: VerifiedTransaction[];
  verification: VerificationPayload;
  links?: {
    statusUrl: string;
    pollAfterMs?: number;
    webhookRegistered?: boolean;
  };
}

// ─── OCR ──────────────────────────────────────
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
