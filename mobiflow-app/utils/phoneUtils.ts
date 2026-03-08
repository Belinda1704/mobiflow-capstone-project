// Rwandan phone helpers. Login uses phone@mobiflow.phone so no real SMS is sent.

const PHONE_SUFFIX = '@mobiflow.phone';

/** MTN and Airtel prefixes (with 250). */
const RWANDA_PREFIXES = ['25078', '25079', '25072', '25073'];

/** Turn a phone number into 12 digits with 250 (e.g. 0781234567 → 250781234567). */
export function normalizeRwandaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';

  if (digits.startsWith('250') && digits.length >= 12) {
    return digits.slice(0, 12);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '250' + digits.slice(1);
  }
  if (digits.length === 9 && !digits.startsWith('0')) {
    return '250' + digits;
  }
  return digits;
}

/** Normalized phone to Firebase auth id (250781234567@mobiflow.phone). */
export function phoneToAuthId(phone: string): string {
  const normalized = normalizeRwandaPhone(phone);
  return normalized ? normalized + PHONE_SUFFIX : '';
}

/** Show auth id as phone number (078 123 4567). Other formats as-is. */
export function formatAuthIdForDisplay(authId: string): string {
  if (!authId || !authId.endsWith(PHONE_SUFFIX)) return authId || '';
  const digits = authId.replace(PHONE_SUFFIX, '');
  if (digits.length === 12 && digits.startsWith('250')) {
    return '0' + digits.slice(3, 5) + ' ' + digits.slice(5, 8) + ' ' + digits.slice(8);
  }
  return digits;
}

/** Add leading 0 for 9 digits starting with 7/8/9/2/3. */
export function autoFormatPhoneInput(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return '';

  if (digits.length === 9 && /^[78923]/.test(digits)) {
    return '0' + digits;
  }
  return digits;
}

/** Check valid Rwandan mobile number. Returns error string or null if valid. */
export function validateRwandaPhone(phone: string): string | null {
  const normalized = normalizeRwandaPhone(phone);
  if (normalized.length !== 12) {
    return 'Enter a valid Rwandan number (e.g. 781234567 or 0781234567)';
  }
  const prefix = normalized.slice(0, 5);
  if (!RWANDA_PREFIXES.includes(prefix)) {
    return 'Number must start with 078, 079, 072, or 073';
  }
  return null;
}
