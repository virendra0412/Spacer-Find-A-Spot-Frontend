// Mirrors the backend's password policy exactly (see
// spacer-backend/src/controllers/auth.controller.js — passwordSchema).
// Keep the two in sync by hand; there's no shared package between the
// two repos to enforce it automatically.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt silently ignores bytes past 72

// Returns a single human-readable error message, or null if the password
// passes every rule.
export function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `At least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `No more than ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter';
  if (!/[0-9]/.test(password)) return 'Include at least one number';
  return null;
}

// Per-rule pass/fail, for a live checklist UI (Signup screen) rather
// than one message at a time.
export function passwordChecklist(password) {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, pass: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'At least one letter', pass: /[a-zA-Z]/.test(password) },
    { label: 'At least one number', pass: /[0-9]/.test(password) },
  ];
}
