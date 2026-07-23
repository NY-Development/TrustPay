// Add this interface
export interface TrialInfo {
  hasUsedTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  daysLeft?: number;
}

export interface CompanyInfo {
  companyName: string;
  companyType: string;
  website?: string;
  country: string;
  region: string;
  city: string;
  address: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  accounts: {
    accountNumber: string;
    accountProvider: string;
  }[];
  pushToken?: string;
  
  // Multi-branch additions
  ownerStatus?: 'PENDING_LICENSE' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  companyInfo?: CompanyInfo;
  branches?: string[];
  
  // Updated to include trial object
  trial?: TrialInfo;

  // Keep existing fields for backward compatibility if needed
  trialStartDate?: string;
  trialEndDate?: string;
  hasUsedTrial?: boolean;
  daysLeft?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  _id: string;
  ownerId: string;
  branchName: string;
  branchCode: string;
  branchNumber: number;
  country: string;
  region: string;
  city: string;
  subCity?: string;
  wereda?: string;
  kebele?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  accounts: {
    accountNumber: string;
    accountProvider: string;
  }[];
  createdAt?: string;
}

export interface Employee {
  _id: string;
  ownerId: string;
  branchId: string | Branch;
  name: string;
  email: string;
  role: 'MANAGER' | 'CASHIER' | 'VERIFIER' | 'RECEPTIONIST' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

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

export interface Verification {
  id: string;
  _id?: string;
  branchId?: string;
  transactionId: string;
  referenceNumber : string;
  provider: string;
  amount: number;
  currency: string;
  payerName: string;
  receiverName?: string;
  receiverAccount?: string;
  paymentDate: string;
  verified: boolean;
  verifiedBy: string;
  verifiedByType?: 'owner' | 'employee';
  status: 'pending' | 'completed' | 'failed';
  source: 'screenshot' | 'manual' | 'qr';
  rawResponse?: Record<string, any>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  // Multi-branch redirects:
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;

  // optional auth payload support
  accessToken?: string;
  refreshToken?: string;

  fullyPaid?: boolean;
  remainingAmount?: number;
}
