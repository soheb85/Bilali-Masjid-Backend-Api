// ---------------------------------------------------------
// 1. USER ROLES
// ---------------------------------------------------------
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TRUSTY: 'TRUSTY',
  MOAZIN: 'MOAZIN',
  USER: 'USER',
} as const;

// Helper array for Mongoose schemas
export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TRUSTY, ROLES.MOAZIN];

// ---------------------------------------------------------
// 2. CAPABILITIES (RBAC)
// ---------------------------------------------------------
export const CAPABILITIES = {
  // Settings
  READ_CONFIG: 'read:config',
  WRITE_CONFIG: 'write:config',
  
  // Users
  READ_USERS: 'read:users',
  WRITE_USERS: 'write:users',
  
  // Security & Audit
  READ_CAPABILITIES: 'read:capabilities',
  WRITE_CAPABILITIES: 'write:capabilities',
  READ_AUDITLOGS: 'read:auditlogs',
  
  // Azan & Prayers
  READ_AZAN: 'read:azan',
  WRITE_AZAN: 'write:azan',
  
  // Announcements (For the banner feature)
  READ_ANNOUNCEMENTS: 'read:announcements',
  WRITE_ANNOUNCEMENTS: 'write:announcements',
  
  // Wildcard (Super Admin Only)
  ALL: '*',
} as const;

export const MODULES = {
  SETTINGS: 'Settings',
  USERS: 'Users',
  SECURITY: 'Security',
  AZAN: 'Azan',
  ANNOUNCEMENTS: 'Announcements',
} as const;

// ---------------------------------------------------------
// 3. AUDIT LOGGING
// ---------------------------------------------------------
export const AUDIT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;

export const AUDIT_RESOURCES = {
  USER: 'User',
  APP_CONFIG: 'AppConfig',
  CAPABILITY: 'Capability',
  AUDIT_LOG: 'AuditLog',
  AZAN: 'Azan',
  ANNOUNCEMENT: 'Announcement',
} as const;

export const AUDIT_ACTIONS = {
  // Config
  UPDATE_CONFIG: 'UPDATE_CONFIG',
  
  // Users & Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  UPDATE_USER_CAPABILITIES: 'UPDATE_USER_CAPABILITIES',
  CREATE_SUPER_ADMIN: 'CREATE_SUPER_ADMIN',
  
  // Capabilities
  CREATE_CAPABILITY: 'CREATE_CAPABILITY',
  BULK_CREATE_CAPABILITIES: 'BULK_CREATE_CAPABILITIES',
  
  // Azan
  UPDATE_AZAN: 'UPDATE_AZAN',
  
  // Announcements
  CREATE_ANNOUNCEMENT: 'CREATE_ANNOUNCEMENT',
  UPDATE_ANNOUNCEMENT: 'UPDATE_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT: 'DELETE_ANNOUNCEMENT',
} as const;

// ---------------------------------------------------------
// 4. API ERROR CODES
// ---------------------------------------------------------
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DB_ERROR: 'DB_ERROR',
} as const;