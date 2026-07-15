export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  VERIFIER: 'VERIFIER',
  RECEPTIONIST: 'RECEPTIONIST',
  OTHER: 'OTHER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES = Object.values(ROLES);

// ─── Owner Status ─────────────────────────────
export const OWNER_STATUS = {
  PENDING_LICENSE: 'PENDING_LICENSE',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type OwnerStatus = (typeof OWNER_STATUS)[keyof typeof OWNER_STATUS];

// ─── Company & Branch Types ───────────────────
export const COMPANY_TYPES = {
  HOTEL: 'HOTEL',
  RESTAURANT: 'RESTAURANT',
  FUEL_STATION: 'FUEL_STATION',
  SUPERMARKET: 'SUPERMARKET',
  PHARMACY: 'PHARMACY',
  RETAIL: 'RETAIL',
  CAFE: 'CAFE',
  OTHER: 'OTHER',
} as const;

export type CompanyType = (typeof COMPANY_TYPES)[keyof typeof COMPANY_TYPES];

// ─── Branch Type Code Prefixes ────────────────
export const BRANCH_TYPE_PREFIXES: Record<CompanyType, string> = {
  HOTEL: 'HTL',
  RESTAURANT: 'RST',
  FUEL_STATION: 'FUL',
  SUPERMARKET: 'SMT',
  PHARMACY: 'PHR',
  RETAIL: 'RTL',
  CAFE: 'CFE',
  OTHER: 'OTH',
};

// ─── Message / Communication Types ──────────
export const MESSAGE_TYPES = {
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  TASK: 'TASK',
  REMINDER: 'REMINDER',
  ALERT: 'ALERT',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// ─── Notification Categories ───────────────────
export const NOTIFICATION_CATEGORIES = {
  OWNER: 'OWNER',
  EMPLOYEE: 'EMPLOYEE',
  BROADCAST: 'BROADCAST',
  SYSTEM: 'SYSTEM',
  SUBSCRIPTION: 'SUBSCRIPTION',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  LICENSE_APPROVAL: 'LICENSE_APPROVAL',
} as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[keyof typeof NOTIFICATION_CATEGORIES];


// ─── Payment Providers (Verify.ET banks) ──────
export const PROVIDERS = {
  CBE: 'cbe',
  BOA: 'boa',
  TELEBIRR: 'telebirr',
  MPESA: 'mpesa',
  CBEBIRR: 'cbebirr',
  DASHEN: 'dashen',
  AWASH: 'awash',
  SIINQEE: 'siinqee',
  KAAFIEBIRR: 'kaafiebirr',
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

export const SUBSCRIPTION_PLANS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];

export const SUBSCRIPTION_PRICING = {
  monthly: { amount: 1500, durationDays: 30 },
  yearly: { amount: 15000, durationDays: 365 },
} as const;

export const SUBSCRIPTION_RECEIVER_NAME = 'YAMLAK NEGASH DUGO';

export const ADMIN_EMAIL = 'yamlaknegash96@gmail.com';


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
  VERIFY_SUBSCRIPTION: 'VERIFY_SUBSCRIPTION',
  VERIFY_SUBSCRIPTION_FAILED: 'VERIFY_SUBSCRIPTION_FAILED',
  TOP_UP_SUBSCRIPTION: 'TOP_UP_SUBSCRIPTION',
  TOP_UP_SUBSCRIPTION_FAILED: 'TOP_UP_SUBSCRIPTION_FAILED',
  CONTACT_SUBMIT: 'CONTACT_SUBMIT',
  APPROVE_LICENSE: 'APPROVE_LICENSE',
  REJECT_LICENSE: 'REJECT_LICENSE',
  SUSPEND_OWNER: 'SUSPEND_OWNER',
  RESTORE_OWNER: 'RESTORE_OWNER',
  CREATE_EMPLOYEE: 'CREATE_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DEACTIVATE_EMPLOYEE: 'DEACTIVATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  SEND_MESSAGE: 'SEND_MESSAGE',
  SWITCH_BRANCH: 'SWITCH_BRANCH',
} as const;
