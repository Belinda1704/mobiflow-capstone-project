// One-time: copy real labels from Firestore into local storage, then strip cloud fields.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction } from '../types/transaction';
import { saveDisplayLabel } from './localDisplayLabelsService';
import { saveDisplayNote } from './localDisplayNotesService';
import { isCloudSafeSmsLabel, cloudLabelForSmsTransaction } from '../utils/smsTransactionPrivacy';

const COLLECTION = 'transactions';
// Flag key v3 (cash + MoMo + SMS)
const FLAG_KEY = (userId: string) => `@mobiflow/privacyCloudStrip_v3_${userId}`;

export async function runSmsPrivacyMigrationOnce(
  userId: string,
  transactions: Transaction[]
): Promise<void> {
  if (!userId) return;
  try {
    const done = await AsyncStorage.getItem(FLAG_KEY(userId));
    if (done === '1') return;
  } catch {
    return;
  }

  const toFix = transactions.filter((t) => !isCloudSafeSmsLabel(t.label));

  for (const t of toFix) {
    const name = (t.label ?? '').trim();
    if (name) {
      try {
        await saveDisplayLabel(userId, t.id, name);
      } catch (e) {
        console.warn('[privacy migration] saveDisplayLabel', t.id, e);
      }
    }
    const oldNotes = (t.notes ?? '').trim();
    if (oldNotes) {
      try {
        await saveDisplayNote(userId, t.id, oldNotes);
      } catch (e) {
        console.warn('[privacy migration] saveDisplayNote', t.id, e);
      }
    }
    const cloud = cloudLabelForSmsTransaction(t.type);
    try {
      await updateDoc(doc(db, COLLECTION, t.id), {
        label: cloud,
        notes: '',
      });
    } catch (e) {
      console.warn('[privacy migration] updateDoc', t.id, e);
    }
  }

  await AsyncStorage.setItem(FLAG_KEY(userId), '1').catch(() => {});
}
