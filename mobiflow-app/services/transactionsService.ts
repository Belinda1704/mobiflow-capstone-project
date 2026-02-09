// save transactions to Firestore and listen for changes in real time
import { collection, query, where, addDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Transaction, CreateTransactionInput } from '../types/transaction';

const COLLECTION = 'transactions';

export async function addTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<void> {
  const amount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  await addDoc(collection(db, COLLECTION), {
    userId,
    label: input.label.trim(),
    amount,
    type: input.type,
    category: input.category,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToTransactions(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  // Query only by userId - no composite index required. Sort client-side.
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Transaction[] = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          label: data.label,
          amount: data.amount,
          type: data.type,
          category: data.category,
          createdAt: data.createdAt ?? null,
        };
      });
      // Sort by createdAt descending (newest first) - client-side to avoid composite index
      list.sort((a, b) => {
        const toMs = (v: typeof a.createdAt) => {
          if (!v) return 0;
          const t = v as { seconds?: number; toDate?: () => Date; toMillis?: () => number };
          if (t.seconds != null) return t.seconds * 1000;
          if (typeof t.toMillis === 'function') return t.toMillis();
          if (typeof t.toDate === 'function') return t.toDate()!.getTime();
          return new Date(v as string | number).getTime();
        };
        return toMs(b.createdAt) - toMs(a.createdAt);
      });
      onUpdate(list);
    },
    (err) => {
      onError?.(err);
      onUpdate([]);
    }
  );
}
