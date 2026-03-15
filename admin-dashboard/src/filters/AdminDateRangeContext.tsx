import { createContext, useContext, useMemo, useState } from 'react';

export type AdminDateRange = 'all' | '7d' | '30d' | '90d' | 'custom';

export type AdminDateRangeSelection = {
  dateRange: AdminDateRange;
  startDate?: string;
  endDate?: string;
};

type AdminDateRangeContextValue = {
  dateRange: AdminDateRange;
  startDate?: string;
  endDate?: string;
  setDateRange: (value: AdminDateRange) => void;
  applyCustomRange: (startDate: string, endDate: string) => void;
};

const AdminDateRangeContext = createContext<AdminDateRangeContextValue | undefined>(undefined);

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AdminDateRangeProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<AdminDateRange>('all');
  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return getDateInputValue(start);
  });
  const [endDate, setEndDate] = useState(() => getDateInputValue(new Date()));

  const value = useMemo(
    () => ({
      dateRange,
      startDate: dateRange === 'custom' ? startDate : undefined,
      endDate: dateRange === 'custom' ? endDate : undefined,
      setDateRange,
      applyCustomRange: (nextStartDate: string, nextEndDate: string) => {
        setStartDate(nextStartDate);
        setEndDate(nextEndDate);
        setDateRange('custom');
      },
    }),
    [dateRange, endDate, startDate]
  );

  return <AdminDateRangeContext.Provider value={value}>{children}</AdminDateRangeContext.Provider>;
}

export function useAdminDateRange() {
  const context = useContext(AdminDateRangeContext);

  if (!context) {
    throw new Error('useAdminDateRange must be used within AdminDateRangeProvider');
  }

  return context;
}
