export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VERIFIER';
  businessId?: string;
  branchId?: string;
  pushToken?: string;
}

export interface Verification {
  id: string;
  transactionId: string;
  provider: string;
  amount: number;
  currency: string;
  payerName: string;
  paymentDate: string;
  verified: boolean;
  status: 'pending' | 'completed' | 'failed';
  source: 'screenshot' | 'manual' | 'qr';
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
