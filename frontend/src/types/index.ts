// Add this interface
export interface TrialInfo {
  hasUsedTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  daysLeft?: number;
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
// ... rest of the file

export interface Verification {
  id: string;
  _id?: string;
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
  status: 'pending' | 'completed' | 'failed';
  source: 'screenshot' | 'manual' | 'qr';
  rawResponse?: Record<string, any>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
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
