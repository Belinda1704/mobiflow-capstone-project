// Hook for reports export functionality - separates export logic from UI
import { useState, useRef, useEffect, useCallback } from 'react';
import { Dimensions } from 'react-native';

import type { Transaction } from '../types/transaction';
import type { ReportsData } from '../services/reportsService';
import {
  exportTransactionsCsv,
  exportTransactionsExcel,
  exportStatement,
  getStatementDateRange,
  type StatementPeriod,
} from '../services/reportsExportService';
import { getBusinessName } from '../services/preferencesService';
import { getTransactionDate } from '../utils/transactionDate';

type ExportType = 'csv' | 'excel' | 'statement' | null;
type PendingExportType = 'statement' | 'csv' | 'excel' | null;

function filterByPeriod(
  transactions: Transaction[],
  period: StatementPeriod,
  options: { startMonth?: Date; endMonth?: Date }
): Transaction[] {
  const { start, end } = getStatementDateRange(period, options);
  return transactions.filter((t) => {
    const d = getTransactionDate(t);
    return d != null && d >= start && d <= end;
  });
}

export function useReportsExport(
  transactions: Transaction[],
  _filteredTransactions: Transaction[],
  reports: ReportsData,
  t: (key: string) => string
) {
  const [exporting, setExporting] = useState<ExportType>(null);
  const [pendingExportType, setPendingExportType] = useState<PendingExportType>(null);
  const [statementPeriodModalVisible, setStatementPeriodModalVisible] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('3months');
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exportButtonLayout, setExportButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    showAbove?: boolean;
  } | null>(null);
  const exportButtonRef = useRef<any>(null);

  const [customPeriodModalVisible, setCustomPeriodModalVisible] = useState(false);
  const [startMonth, setStartMonth] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    d.setDate(1);
    return d;
  });
  const [endMonth, setEndMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [startMonthPickerVisible, setStartMonthPickerVisible] = useState(false);
  const [endMonthPickerVisible, setEndMonthPickerVisible] = useState(false);

  useEffect(() => {
    if (exportMenuVisible && exportButtonRef.current) {
      exportButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const screenHeight = Dimensions.get('window').height;
        const showAbove = pageY + height > screenHeight / 2;
        setExportButtonLayout({
          x: pageX,
          y: showAbove ? pageY - 4 : pageY + height + 4,
          width,
          height,
          showAbove,
        });
      });
    }
  }, [exportMenuVisible]);

  const runExportForPeriod = useCallback(
    async (period: StatementPeriod, exportType?: PendingExportType) => {
      const type = exportType ?? pendingExportType;
      const options = period === 'custom' ? { startMonth, endMonth } : {};
      if (type === 'statement') {
        try {
          setExporting('statement');
          const businessName = await getBusinessName();
          await exportStatement(transactions, period, options, {
            statementTitle: t('statementTitle'),
            statementPeriod: t('statementPeriod'),
            statementSummary: t('statementSummary'),
            totalIncome: t('totalIncome'),
            totalExpense: t('totalExpense'),
            netPosition: t('netPosition'),
            date: t('date'),
            description: t('description'),
            category: t('category'),
            amount: t('amount'),
            noTransactionsInPeriod: t('noTransactionsInPeriod'),
            generatedBy: t('generatedBy'),
            businessName,
            dateGenerated: t('dateGenerated'),
            downloadStatement: t('downloadStatement'),
            statementDownloaded: t('statementDownloaded'),
            ok: t('ok') || 'OK',
            error: t('error') || 'Error',
          });
        } finally {
          setExporting(null);
        }
      } else if (type === 'csv') {
        try {
          setExporting('csv');
          const filtered = filterByPeriod(transactions, period, options);
          await exportTransactionsCsv(filtered, {
            exportCSV: t('exportCSV'),
            error: t('error') || 'Error',
          });
        } finally {
          setExporting(null);
        }
      } else if (type === 'excel') {
        try {
          setExporting('excel');
          const filtered = filterByPeriod(transactions, period, options);
          await exportTransactionsExcel(filtered, {
            exportExcel: t('exportExcel'),
            error: t('error') || 'Error',
          });
        } finally {
          setExporting(null);
        }
      }
      setPendingExportType(null);
      setStatementPeriodModalVisible(false);
    },
    [transactions, startMonth, endMonth, pendingExportType, t]
  );

  const handlePeriodChosen = useCallback(
    (period: StatementPeriod) => {
      if (period === 'custom') {
        setStatementPeriodModalVisible(false);
        setCustomPeriodModalVisible(true);
        return;
      }
      runExportForPeriod(period);
    },
    [runExportForPeriod]
  );

  const handleCustomPeriodConfirm = useCallback(() => {
    setCustomPeriodModalVisible(false);
    runExportForPeriod('custom');
  }, [runExportForPeriod]);

  const handleExportStatement = useCallback((period?: StatementPeriod) => {
    if (period == null) {
      setPendingExportType('statement');
      setStatementPeriodModalVisible(true);
      return;
    }
    runExportForPeriod(period, 'statement');
  }, [runExportForPeriod]);

  const handleExportCSV = useCallback((period?: StatementPeriod) => {
    if (period == null) {
      setPendingExportType('csv');
      setStatementPeriodModalVisible(true);
      return;
    }
    runExportForPeriod(period, 'csv');
  }, [runExportForPeriod]);

  const handleExportExcel = useCallback((period?: StatementPeriod) => {
    if (period == null) {
      setPendingExportType('excel');
      setStatementPeriodModalVisible(true);
      return;
    }
    runExportForPeriod(period, 'excel');
  }, [runExportForPeriod]);

  return {
    exporting,
    statementPeriodModalVisible,
    setStatementPeriodModalVisible,
    statementPeriod,
    setStatementPeriod,
    exportMenuVisible,
    setExportMenuVisible,
    exportButtonLayout,
    exportButtonRef,
    customPeriodModalVisible,
    setCustomPeriodModalVisible,
    startMonth,
    setStartMonth,
    endMonth,
    setEndMonth,
    startMonthPickerVisible,
    setStartMonthPickerVisible,
    endMonthPickerVisible,
    setEndMonthPickerVisible,
    handlePeriodChosen,
    handleCustomPeriodConfirm,
    handleExportStatement,
    handleExportCSV,
    handleExportExcel,
  };
}
