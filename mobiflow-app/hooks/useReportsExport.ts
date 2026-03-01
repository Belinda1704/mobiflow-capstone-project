// Hook for reports export functionality - separates export logic from UI
import { useState, useRef, useEffect, useCallback } from 'react';
import { Dimensions } from 'react-native';

import type { Transaction } from '../types/transaction';
import type { ReportsData } from '../services/reportsService';
import { exportReportsPdf, exportTransactionsCsv, exportStatement, type StatementPeriod } from '../services/reportsExportService';

type ExportType = 'pdf' | 'csv' | 'statement' | null;

export function useReportsExport(
  transactions: Transaction[],
  filteredTransactions: Transaction[],
  reports: ReportsData,
  t: (key: string) => string
) {
  const [exporting, setExporting] = useState<ExportType>(null);
  const [statementPeriodModalVisible, setStatementPeriodModalVisible] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState<StatementPeriod>('3months');
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exportButtonLayout, setExportButtonLayout] = useState<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    showAbove?: boolean 
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

  // Calculate export menu position when menu opens
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
          showAbove 
        });
      });
    }
  }, [exportMenuVisible]);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting('pdf');
      await exportReportsPdf(reports, {
        reports: t('reports'),
        reportsSubtitle: t('reportsSubtitle'),
        totalIncome: t('totalIncome'),
        totalExpense: t('totalExpense'),
        net: t('net'),
        incomeVsExpense7Days: t('incomeVsExpense7Days'),
        income: t('income'),
        expense: t('expense'),
        expensesByCategory: t('expensesByCategory'),
        transactions: t('transactions'),
        exportPDF: t('exportPDF'),
        error: t('error') || 'Error',
      });
    } catch (err) {
      // Error handling is done in the service
    } finally {
      setExporting(null);
    }
  }, [reports, t]);

  const handleExportCSV = useCallback(async () => {
    try {
      setExporting('csv');
      await exportTransactionsCsv(filteredTransactions, {
        exportCSV: t('exportCSV'),
        error: t('error') || 'Error',
      });
    } catch (err) {
      // Error handling is done in the service
    } finally {
      setExporting(null);
    }
  }, [filteredTransactions, t]);

  const handleExportStatement = useCallback(async (period?: StatementPeriod) => {
    if (!period) {
      setStatementPeriodModalVisible(true);
      return;
    }
    
    try {
      setExporting('statement');
      await exportStatement(
        transactions,
        period,
        period === 'custom' ? { startMonth, endMonth } : {},
        {
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
          downloadStatement: t('downloadStatement'),
          statementDownloaded: t('statementDownloaded'),
          ok: t('ok') || 'OK',
          error: t('error') || 'Error',
        }
      );
    } catch (err) {
      // Error handling is done in the service
    } finally {
      setExporting(null);
    }
  }, [transactions, startMonth, endMonth, t]);

  return {
    // State
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
    // Handlers
    handleExportPDF,
    handleExportCSV,
    handleExportStatement,
  };
}
