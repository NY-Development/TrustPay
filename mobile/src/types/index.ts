// ─── Trial ────────────────────────────────────────────
export interface TrialInfo {
  hasUsedTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  daysLeft?: number;
}

// ─── Company Info ─────────────────────────────────────
export interface CompanyInfo {
  companyName: string;
  companyType: string;
  website?: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
}

// ─── Account ──────────────────────────────────────────
export interface Account {
  _id?: string;
  accountNumber: string;
  accountProvider: string;
}

// ─── User (Owner) ─────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  actorType?: 'owner' | 'employee';
  ownerStatus?: 'PENDING_LICENSE' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  accounts: Account[];
  pushToken?: string;
  companyInfo?: CompanyInfo;
  branches?: string[];

  trial?: TrialInfo;
  trialStartDate?: string;
  trialEndDate?: string;
  hasUsedTrial?: boolean;
  daysLeft?: number;

  createdAt?: string;
  updatedAt?: string;
}

// ─── Branch ───────────────────────────────────────────
export interface Branch {
  _id: string;
  ownerId: string;
  branchName: string;
  branchCode: string;
  branchNumber: number;
  country?: string;
  region?: string;
  city?: string;
  subCity?: string;
  wereda?: string;
  kebele?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  accounts: Account[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Employee ──────────────────────────────────────────
export interface Employee {
  _id: string;
  ownerId: string;
  branchId: string | Branch;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  pushToken?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Message ──────────────────────────────────────────
export interface Message {
  _id: string;
  senderId: string;
  branchId?: string;
  recipientIds: string[];
  recipientType: 'INDIVIDUAL' | 'BRANCH' | 'COMPANY';
  messageType: 'ANNOUNCEMENT' | 'TASK' | 'REMINDER' | 'ALERT';
  title: string;
  body: string;
  readBy: string[];
  createdAt: string;
}

// ─── Verification ─────────────────────────────────────
export interface Verification {
  id: string;
  _id?: string;
  transactionId: string;
  referenceNumber: string;
  provider: string;
  amount: number;
  currency: string;
  senderName?: string;
  payerName?: string;
  receiverName?: string;
  receiverAccount?: string;
  paymentDate: string;
  verified: boolean;
  verifiedBy: string;
  verifiedByType?: 'owner' | 'employee';
  branchId?: string;
  status: 'pending' | 'completed' | 'failed';
  source: 'screenshot' | 'manual' | 'qr' | 'ocr';
  rawResponse?: Record<string, any>;
  createdAt: string;
}

// ─── Subscription ─────────────────────────────────────
export interface Subscription {
  _id: string;
  branchId: string;
  ownerId: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  transactionId: string;
  payerName: string;
  receiverName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending' | 'partial_payment';
  paidAmount: number;
  requiredAmount: number;
  fullyPaid: boolean;
  verificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatusData {
  active: boolean;
  isPartialPayment: boolean;
  subscription: Subscription | null;
  remainingAmount: number;
  isSubsAccessAllowed?: boolean;
  subsAccessSource?: 'trial' | 'subscription' | 'none';
  subsAccessTrialExpiresAt?: string | null;
}

export interface SubscriptionVerifyResponse {
  success: boolean;
  message: string;
  data?: Subscription;
  fullyPaid?: boolean;
  remainingAmount?: number;
}

// ─── Public Stats ─────────────────────────────────────
export interface PublicStats {
  companies: number;
  branches: number;
  verifications: number;
  verifiedAmount: number;
  successRate: number;
  countriesServed: number;
  companiesByType: { type: string; count: number }[];
  verificationsByProvider: { provider: string; count: number }[];
  trustedCompanies: { name: string; type: string; city?: string; region?: string }[];
  platformLaunchYear: number;
}

// ─── API Response ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  accessToken?: string;
  refreshToken?: string;
  fullyPaid?: boolean;
  remainingAmount?: number;
}
