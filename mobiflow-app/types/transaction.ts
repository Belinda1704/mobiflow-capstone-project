// shapes for transaction data from Firestore
export type Transaction = {
  id: string;
  userId: string;
  label: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  createdAt?: FirestoreTimestamp | null;
};

export type FirestoreTimestamp = {
  toDate?: () => Date;
  seconds?: number;
};

export type CreateTransactionInput = {
  label: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
};

export type FilterTab = 'all' | 'income' | 'expense';
