export const CONSTANTS = {
  BCRYPT_ROUNDS: 10,
  JWT_EXPIRE: '7d',
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_SETUP_EXPIRE: 24 * 60 * 60 * 1000, // 24 hours
  
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_SETUP: 'password-setup',
    STAFF_CREDENTIALS: 'staff-credentials',
    APPLICATION_APPROVED: 'application-approved'
  }
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  PASSWORD_NOT_SET: 'Please set your password first',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated',
  ROLE_MISMATCH: 'Invalid role for this login portal'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  PASSWORD_SET: 'Password set successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  STAFF_CREATED: 'Staff member created successfully',
  APPLICATION_APPROVED: 'Application approved and converted to lead'
};