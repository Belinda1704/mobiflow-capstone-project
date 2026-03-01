/** Result of checking the password against our rules (length, upper, lower, number, special). */
export type PasswordRequirements = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

/** Check which rules the password passes (length, uppercase, etc.). */
export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

/** True if the password meets all the rules the app needs for signup. */
export function isPasswordStrong(password: string): boolean {
  const r = getPasswordRequirements(password);
  return r.minLength && r.hasUppercase && r.hasLowercase && r.hasNumber && r.hasSpecial;
}
