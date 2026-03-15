const PHONE_SUFFIX = '@mobiflow.phone';

export function normalizeRwandaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('250') && digits.length >= 12) {
    return digits.slice(0, 12);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `250${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `250${digits}`;
  }

  return digits;
}

export function phoneToAuthId(phone: string): string {
  const normalized = normalizeRwandaPhone(phone);
  return normalized ? `${normalized}${PHONE_SUFFIX}` : '';
}

export function normalizeAdminIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return phoneToAuthId(trimmed);
}

export function validateAdminIdentifier(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return 'Enter email and password.';

  if (trimmed.includes('@')) {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return isValidEmail ? null : 'Enter a valid email address.';
  }

  return validateRwandaPhone(trimmed);
}

export function validateRwandaPhone(phone: string): string | null {
  const normalized = normalizeRwandaPhone(phone);
  if (normalized.length !== 12) {
    return 'Enter a valid Rwandan number.';
  }
  if (!/^250(72|73|78|79)\d{7}$/.test(normalized)) {
    return 'Number must start with 072, 073, 078, or 079.';
  }
  return null;
}

export function formatAdminLabel(email: string | null | undefined): string {
  if (!email) return 'Admin user';
  if (email.endsWith(PHONE_SUFFIX)) {
    const digits = email.replace(PHONE_SUFFIX, '');
    if (digits.length === 12 && digits.startsWith('250')) {
      return `0${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
  }
  return email;
}

/** Two-letter initials from admin label. For emails (no display name) uses first 2 chars of local part so each admin gets unique initials (e.g. user@… → US, weswesendy2@… → WE). */
export function getAdminInitials(label: string | null | undefined): string {
  if (!label || !label.trim()) return 'A';
  const t = label.trim();
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase().slice(0, 2);
  }
  if (t.includes('@')) {
    const [local] = t.split('@');
    if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local && local.length === 1) return local.toUpperCase() + (t.split('@')[1]?.charAt(0)?.toUpperCase() || '');
    return local ? local.slice(0, 2).toUpperCase() : 'A';
  }
  const letters = t.replace(/\d/g, '').slice(0, 2) || t.slice(0, 2);
  return (letters || 'A').toUpperCase().slice(0, 2);
}
