export type PaymentMethod = 'cash' | 'mobile_money';

export type Transaction = {
  id: string;
  userId: string;
  label: string;
  /**
   * Device-only display label.
   * Used to show parsed sender name/phone inside the user app,
   * without saving those details to the external database.
   */
  displayLabel?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt?: FirestoreTimestamp | null;
  smsId?: string | null;
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
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt?: Date;
  smsId?: string | null;
};

export type FilterTab = 'all' | 'income' | 'expense';

export type DateRangeFilter = 'all' | 'today' | 'week' | 'last7days' | 'month' | '30days' | 'custom';

export type PaymentFilter = 'all' | 'cash' | 'mobile_money';

export type TransactionFilters = {
  type: FilterTab;
  dateRange: DateRangeFilter;
  customStartDate?: Date;
  customEndDate?: Date;
  category: string;
  paymentMethod: PaymentFilter;
  search: string;
};
