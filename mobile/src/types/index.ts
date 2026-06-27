export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VERIFIER';
  businessId?: string;
  branchId?: string;
  pushToken?: string;
  accounts?: {
    accountNumber: string;
    accountProvider: string;
  }[];
}

export interface Verification {
  id: string;
  _id?: string;
  transactionId: string;
  provider: string;
  amount: number;
  currency: string;
  payerName: string;
  receiverName?: string;
  receiverAccount?: string;
  paymentDate: string;
  verified: boolean;
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
  status: 'active' | 'expired' | 'pending';
  verificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
