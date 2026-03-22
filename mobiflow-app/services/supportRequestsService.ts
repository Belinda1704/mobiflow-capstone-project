import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../config/firebase';
import { normalizeRwandaPhone, validateRwandaPhone } from '../utils/phoneUtils';

function toLocalPhoneDisplay(normalizedPhone: string): string {
  if (normalizedPhone.length === 12 && normalizedPhone.startsWith('250')) {
    return `0${normalizedPhone.slice(3)}`;
  }
  return normalizedPhone;
}

function getSupportRequestErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Could not send your request. Please try again.';
  }

  const raw = error.message?.trim() ?? '';
  const lower = raw.toLowerCase();
  if (!raw) {
    return 'Could not send your request. Please try again.';
  }
  if (lower.includes('missing or insufficient permissions') || lower.includes('permission-denied')) {
    return 'Support request is not available right now. Please contact support by email.';
  }
  return raw;
}

export async function createPasswordResetSupportRequest(phone: string): Promise<void> {
  const validationError = validateRwandaPhone(phone);
  if (validationError) {
    throw new Error(validationError);
  }

  const normalizedPhone = normalizeRwandaPhone(phone);
  try {
    await addDoc(collection(db, 'supportRequests'), {
      type: 'password_reset',
      status: 'open',
      source: 'mobile-app',
      phone: toLocalPhoneDisplay(normalizedPhone),
      normalizedPhone,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(getSupportRequestErrorMessage(error));
  }
}
