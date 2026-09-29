export const PERMISSIONS = {
  VIEW_VOTERS: 'VIEW_VOTERS',
  IMPORT_VOTERS: 'IMPORT_VOTERS',
  EXPORT_VOTERS: 'EXPORT_VOTERS',
  MANAGE_WARDS: 'MANAGE_WARDS',
  MANAGE_ADMINS: 'MANAGE_ADMINS',
  MANAGE_WARD_ADMINS: 'MANAGE_WARD_ADMINS',
  MANAGE_INTEREST_OPTIONS: 'MANAGE_INTEREST_OPTIONS',
  VIEW_PUBLIC_SUBMISSIONS: 'VIEW_PUBLIC_SUBMISSIONS',
  MANAGE_CONTENT: 'MANAGE_CONTENT',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  VIEW_FULL_MOBILE: 'VIEW_FULL_MOBILE',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  WARD_ADMIN: 'WardAdmin',
} as const;

export const POPUP_SHOWN_KEY = 'village_popup_shown';
export const POPUP_SUBMITTED_KEY = 'village_popup_submitted';
export const LANG_KEY = 'village_lang';
export const SESSION_ID_KEY = 'village_session_id';
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const DEFAULT_PAGE_SIZE = 25;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const POPUP_DELAY_MS = 10000;
