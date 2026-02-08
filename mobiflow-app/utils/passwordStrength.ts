/** Password requirement check result */
export type PasswordRequirements = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

/** Check which password requirements are met */
export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

/** Returns true if all requirements are met */
export function isPasswordStrong(password: string): boolean {
  const r = getPasswordRequirements(password);
  return r.minLength && r.hasUppercase && r.hasLowercase && r.hasNumber && r.hasSpecial;
}
