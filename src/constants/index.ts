// ─────────────────────────────────────────────────────────────
// 1. ROLES
// ─────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN:       'ADMIN',
  TRUSTY:      'TRUSTY',
  MOAZIN:      'MOAZIN',
  USER:        'USER',
} as const;

export const STAFF_ROLES = [
  ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TRUSTY, ROLES.MOAZIN
];

// ─────────────────────────────────────────────────────────────
// 2. CAPABILITIES (every key the app uses)
// ─────────────────────────────────────────────────────────────
export const CAPABILITIES = {
  READ_CONFIG:           'read:config',
  WRITE_CONFIG:          'write:config',
  READ_USERS:            'read:users',
  WRITE_USERS:           'write:users',
  READ_CAPABILITIES:     'read:capabilities',
  WRITE_CAPABILITIES:    'write:capabilities',
  READ_AUDITLOGS:        'read:auditlogs',
  READ_AZAN:             'read:azan',
  WRITE_AZAN:            'write:azan',
  READ_ANNOUNCEMENTS:    'read:announcements',
  WRITE_ANNOUNCEMENTS:   'write:announcements',
  SEND_NOTIFICATIONS:    'send:notifications',
  READ_NOTIFICATIONS:    'read:notifications',
  ALL:                   '*',
} as const;

// ─────────────────────────────────────────────────────────────
// 3. DEFAULT ROLE → UI PERMISSIONS MAP
// This is used when AppConfig doesn't have roleScreenMapping set
// Flutter uses these strings to draw admin dashboard menu items
// ─────────────────────────────────────────────────────────────
export const DEFAULT_ROLE_UI_PERMISSIONS: Record<string, string[]> = {
  MOAZIN: [
    'manage_prayer',        // See "Manage Prayer Times" menu item
    'manage_announcements', // See "Manage Announcements" menu item
  ],
  TRUSTY: [
    'view_audit',           // See "Audit Logs" menu item
    'view_reports',
  ],
  ADMIN: [
    'manage_prayer',
    'manage_announcements',
    'send_notifications',   // See "Broadcast Notification"
    'view_audit',
    'manage_users',
  ],
  SUPER_ADMIN: ['*'],       // Sees everything
};

// ─────────────────────────────────────────────────────────────
// 4. AUDIT
// ─────────────────────────────────────────────────────────────
export const AUDIT_SEVERITY = {
  INFO:     'INFO',
  WARNING:  'WARNING',
  CRITICAL: 'CRITICAL',
  ERROR:    'ERROR',
} as const;

export const AUDIT_RESOURCES = {
  USER:            'User',
  APP_CONFIG:      'AppConfig',
  CAPABILITY:      'Capability',
  AUDIT_LOG:       'AuditLog',
  AZAN:            'Azan',
  ANNOUNCEMENT:    'Announcement',
  NOTIFICATION:    'Notification',
  OTP:             'Otp',
} as const;

export const AUDIT_ACTIONS = {
  UPDATE_CONFIG:              'UPDATE_CONFIG',
  LOGIN_SUCCESS:              'LOGIN_SUCCESS',
  LOGIN_FAILED:               'LOGIN_FAILED',
  LOGOUT:                     'LOGOUT',
  TOKEN_REFRESHED:            'TOKEN_REFRESHED',
  UPDATE_USER_CAPABILITIES:   'UPDATE_USER_CAPABILITIES',
  CREATE_SUPER_ADMIN:         'CREATE_SUPER_ADMIN',
  CREATE_CAPABILITY:          'CREATE_CAPABILITY',
  BULK_CREATE_CAPABILITIES:   'BULK_CREATE_CAPABILITIES',
  UPDATE_AZAN:                'UPDATE_AZAN',
  CREATE_ANNOUNCEMENT:        'CREATE_ANNOUNCEMENT',
  UPDATE_ANNOUNCEMENT:        'UPDATE_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT:        'DELETE_ANNOUNCEMENT',
  SEND_NOTIFICATION:          'SEND_NOTIFICATION',
  REQUEST_OTP:                'REQUEST_OTP',
  VERIFY_OTP:                 'VERIFY_OTP',
  RESET_PASSWORD:             'RESET_PASSWORD',
  UPDATE_FCM_TOKEN:           'UPDATE_FCM_TOKEN',
  MOBILE_LOGIN:               'MOBILE_LOGIN',
  MOBILE_REGISTER:            'MOBILE_REGISTER',
} as const;

// ─────────────────────────────────────────────────────────────
// 5. ERROR CODES
// ─────────────────────────────────────────────────────────────
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_FAILED:      'AUTH_FAILED',
  FORBIDDEN:        'FORBIDDEN',
  NOT_FOUND:        'NOT_FOUND',
  SERVER_ERROR:     'SERVER_ERROR',
  CONFLICT:         'CONFLICT',
  UNAUTHORIZED:     'UNAUTHORIZED',
  DB_ERROR:         'DB_ERROR',
  OTP_EXPIRED:      'OTP_EXPIRED',
  OTP_INVALID:      'OTP_INVALID',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',
} as const;

// ─────────────────────────────────────────────────────────────
// 6. FCM TOPICS
// ─────────────────────────────────────────────────────────────
export const FCM_TOPICS = {
  ALL_USERS:    'all_users',
  GLOBAL:       'global',
  STAFF:        'staff_updates',
} as const;

// ─────────────────────────────────────────────────────────────
// 7. API ROUTES (single source of truth — avoids typos)
// ─────────────────────────────────────────────────────────────
export const API_ROUTES = {
  AUTH_LOGIN:         '/api/auth/login',
  AUTH_ME:            '/api/auth/me',
  AUTH_REFRESH:       '/api/auth/refresh',
  AUTH_FORGOT_PW:     '/api/auth/forgot-password',
  AUTH_VERIFY_OTP:    '/api/auth/verify-otp',
  AUTH_RESET_PW:      '/api/auth/reset-password',
  MOBILE_LOGIN:       '/api/users/mobile-login',
  UPDATE_FCM:         '/api/users/fcm-token',
  AZAN:               '/api/azan',
  ANNOUNCEMENTS:      '/api/announcements',
  BROADCAST:          '/api/notifications/broadcast',
  NOTIF_HISTORY:      '/api/notifications/history',
  CONFIG:             '/api/config',
  AUDIT_LOGS:         '/api/audit-logs',
} as const;