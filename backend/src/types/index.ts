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
export interface SettlementAccountMatch {
  matched: boolean;
  expected: string;
  actual?: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  provider: Provider | string;
  transactionId: string;
  referenceNumber?: string;
  amount: number;
  currency: string;
  payerName: string;
  paymentDate: Date | string;
  receiverName?: string;
  receiverAccount?: string;
  settlementAccountMatch?: SettlementAccountMatch;
  raw?: Record<string, unknown>;
}

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
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
