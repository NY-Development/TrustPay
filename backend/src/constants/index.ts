// ─── Roles ────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  VERIFIER: 'VERIFIER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES = Object.values(ROLES);

// ─── Payment Providers ────────────────────────
export const PROVIDERS = {
  TELEBIRR: 'telebirr',
  CBE: 'cbe',
  ABYSSINIA: 'abyssinia',
  MPESA: 'mpesa',
  CBEBIRR: 'cbebirr',
  DASHEN: 'dashen',
} as const;

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export const ALL_PROVIDERS = Object.values(PROVIDERS);

// ─── Verification Sources ─────────────────────
export const VERIFICATION_SOURCES = {
  SCREENSHOT: 'screenshot',
  MANUAL: 'manual',
  QR: 'qr',
} as const;

export type VerificationSource = (typeof VERIFICATION_SOURCES)[keyof typeof VERIFICATION_SOURCES];

// ─── Subscription Tiers ───────────────────────
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// ─── Cookie Config ────────────────────────────
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // overridden at runtime from env
  sameSite: 'strict' as const,
  path: '/',
};

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// ─── Audit Actions ────────────────────────────
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  VERIFY_PAYMENT: 'VERIFY_PAYMENT',
  VERIFY_PAYMENT_FAILED: 'VERIFY_PAYMENT_FAILED',
  CREATE_BUSINESS: 'CREATE_BUSINESS',
  UPDATE_BUSINESS: 'UPDATE_BUSINESS',
  CREATE_BRANCH: 'CREATE_BRANCH',
  UPDATE_BRANCH: 'UPDATE_BRANCH',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
} as const;
