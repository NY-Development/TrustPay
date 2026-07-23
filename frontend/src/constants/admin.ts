// Mirrors backend/src/constants/index.ts — kept in sync manually since the
// frontend bundle can't reach across into the backend workspace.

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

export const ALL_ROLES = Object.values(ROLES);

export const OWNER_STATUS = {
  PENDING_LICENSE: 'PENDING_LICENSE',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const ALL_OWNER_STATUSES = Object.values(OWNER_STATUS);
