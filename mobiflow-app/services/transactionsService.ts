// Add, update, delete, subscribe to transactions in Firestore
import {
  collection,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  getDocsFromCache,
  Unsubscribe,
  type QuerySnapshot,
  setDoc,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Transaction, CreateTransactionInput, PaymentMethod } from '../types/transaction';

const COLLECTION = 'transactions';

export async function addTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<void> {
  const amount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  const createdAt = input.createdAt
    ? Timestamp.fromDate(input.createdAt)
    : serverTimestamp();
  
  try {
    const baseData = {
      userId,
      label: input.label.trim(),
      amount,
      type: input.type,
      category: input.category,
      paymentMethod: input.paymentMethod ?? 'mobile_money',
      notes: input.notes?.trim() ?? '',
      createdAt,
      ...(input.smsId != null && input.smsId !== '' && { smsId: input.smsId }),
    };

    // SMS transactions use a fixed id (userId + smsId) so the same SMS doesn’t create duplicate docs.
    if (input.smsId != null && input.smsId !== '') {
      const stableId = `${userId}_${input.smsId}`;
      const ref = doc(db, COLLECTION, stableId);
      await setDoc(ref, baseData, { merge: false });
      console.log('Transaction added/updated from SMS with stable id:', stableId, input.label);
      return;
    }

    // Manual: new doc id.
    const docRef = await addDoc(collection(db, COLLECTION), baseData);
    console.log('Transaction added (manual or no smsId):', docRef.id, input.label);
  } catch (error: any) {
    // Offline = queued; else rethrow
    if (error?.code !== 'unavailable' && !error?.message?.includes('offline')) {
      console.error('Error adding transaction:', error);
      throw error;
    }
    // Queued; listener gets from cache when back online
    console.log('Transaction queued for sync when online:', input.label);
  }
}

export async function updateTransaction(
  transactionId: string,
  input: Partial<CreateTransactionInput & { amount: number }>
): Promise<void> {
  const ref = doc(db, COLLECTION, transactionId);
  const updates: Record<string, unknown> = {};
  if (input.label !== undefined) updates.label = input.label.trim();
  if (input.amount !== undefined) {
    const type = input.type ?? 'expense';
    updates.amount = type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  }
  if (input.type !== undefined) updates.type = input.type;
  if (input.category !== undefined) updates.category = input.category;
  if (input.paymentMethod !== undefined) updates.paymentMethod = input.paymentMethod;
  if (input.notes !== undefined) updates.notes = input.notes.trim();
  if (Object.keys(updates).length === 0) return;
  await updateDoc(ref, updates);
}

// Timeout for slow network
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out. Please check your internet connection.')), timeoutMs)
    ),
  ]);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await withTimeout(deleteDoc(doc(db, COLLECTION, transactionId)), 10000);
}

const FIRESTORE_BATCH_SIZE = 500;

// Delete all for user (e.g. reset). onProgress for UI.
export async function deleteAllTransactionsForUser(
  userId: string,
  onProgress?: (deleted: number, total: number) => void
): Promise<number> {
  if (!userId) return 0;
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  const ids = snap.docs.map((d) => d.id);
  const total = ids.length;
  if (total === 0) {
    onProgress?.(0, 0);
    return 0;
  }
  let deleted = 0;
  for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = ids.slice(i, i + FIRESTORE_BATCH_SIZE);
    for (const id of chunk) {
      batch.delete(doc(db, COLLECTION, id));
    }
    await batch.commit();
    deleted += chunk.length;
    onProgress?.(deleted, total);
  }
  return deleted;
}

const BULK_DELETE_BATCH_SIZE = 8;
const BULK_DELETE_DELAY_MS = 120;

// Delete selected in batches; onProgress for progress bar.
export async function deleteTransactions(
  ids: string[],
  onProgress?: (deleted: number, total: number) => void
): Promise<void> {
  if (ids.length === 0) return;
  const total = ids.length;
  const failures: { id: string; reason: unknown }[] = [];

  for (let i = 0; i < ids.length; i += BULK_DELETE_BATCH_SIZE) {
    const batch = ids.slice(i, i + BULK_DELETE_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((id) => withTimeout(deleteDoc(doc(db, COLLECTION, id)), 15000))
    );
    results.forEach((r, idx) => {
      if (r.status === 'rejected') failures.push({ id: batch[idx], reason: r.reason });
    });
    const deleted = Math.min(i + batch.length, total);
    onProgress?.(deleted, total);
    if (i + BULK_DELETE_BATCH_SIZE < ids.length) {
      await new Promise((r) => setTimeout(r, BULK_DELETE_DELAY_MS));
    }
  }

  if (failures.length > 0) {
    const msg = failures[0].reason instanceof Error ? failures[0].reason.message : String(failures[0].reason);
    throw new Error(
      `Failed to delete ${failures.length} transaction(s). ${msg}. Check your connection and try again.`
    );
  }
}

export async function updateTransactionsCategory(
  ids: string[],
  category: string
): Promise<void> {
  await Promise.all(
    ids.map((id) => updateDoc(doc(db, COLLECTION, id), { category }))
  );
}

// Get transactions: cache first, then network. [] when offline.
export async function getTransactionsSnapshot(userId: string): Promise<Transaction[]> {
  if (!userId) return [];
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  try {
    const cacheSnap = await getDocsFromCache(q);
    if (!cacheSnap.empty) return snapshotToList(cacheSnap);
  } catch {
    // No cache: fetch
  }
  try {
    const snap = await getDocs(q);
    return snapshotToList(snap);
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Offline: Cannot fetch transactions for category suggestion');
      return [];
    }
    console.error('Error fetching transactions snapshot:', error);
    return [];
  }
}

// Snapshot to list, newest first
function snapshotToList(snap: QuerySnapshot): Transaction[] {
  const list: Transaction[] = snap.docs.map((d) => {
    const data = d.data();
    const pm = data.paymentMethod;
    return {
      id: d.id,
      userId: data.userId,
      label: data.label,
      amount: data.amount,
      type: data.type,
      category: data.category,
      paymentMethod: pm === 'cash' || pm === 'mobile_money' ? (pm as PaymentMethod) : 'mobile_money',
      notes: data.notes ?? '',
      createdAt: data.createdAt ?? null,
      smsId: data.smsId ?? null,
    };
  });
  const toMs = (v: Transaction['createdAt']) => {
    if (!v) return 0;
    const t = v as { seconds?: number; toDate?: () => Date; toMillis?: () => number };
    if (t.seconds != null) return t.seconds * 1000;
    if (typeof t.toMillis === 'function') return t.toMillis();
    if (typeof t.toDate === 'function') return t.toDate()!.getTime();
    return new Date(v as string | number).getTime();
  };
  list.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return list;
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
    where('userId', '==', userId)
  );

  // Cache first so list not empty while loading
  getDocsFromCache(q)
    .then((snap) => {
      if (!snap.empty) onUpdate(snapshotToList(snap));
    })
    .catch(() => {});

  // Live
  return onSnapshot(q, (snap) => {
    onUpdate(snapshotToList(snap));
  },
    (err) => {
      if (err.code === 'unavailable' || err.message?.includes('offline')) {
        getDocsFromCache(q)
          .then((snap) => onUpdate(snapshotToList(snap)))
          .catch(() => onUpdate([]));
      } else {
        onError?.(err);
        onUpdate([]);
      }
    }
  );
}
