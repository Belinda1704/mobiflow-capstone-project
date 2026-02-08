// save transactions to Firestore and listen for changes in real time
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';

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
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
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
      onUpdate(list);
    },
    (err) => {
      onError?.(err);
      onUpdate([]);
    }
  );
}
