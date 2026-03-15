import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../config/firebase';
import { normalizeRwandaPhone, validateRwandaPhone } from '../utils/phoneUtils';

function toLocalPhoneDisplay(normalizedPhone: string): string {
  if (normalizedPhone.length === 12 && normalizedPhone.startsWith('250')) {
    return `0${normalizedPhone.slice(3)}`;
  }
  return normalizedPhone;
}

export async function createPasswordResetSupportRequest(phone: string): Promise<void> {
  const validationError = validateRwandaPhone(phone);
  if (validationError) {
    throw new Error(validationError);
  }

  const normalizedPhone = normalizeRwandaPhone(phone);
  await addDoc(collection(db, 'supportRequests'), {
    type: 'password_reset',
    status: 'open',
    source: 'mobile-app',
    phone: toLocalPhoneDisplay(normalizedPhone),
    normalizedPhone,
    createdAt: serverTimestamp(),
  });
}
