// Reports export: PDF, CSV, Statement. Print/Sharing/FileSystem here.
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import type { ReportsData } from './reportsService';
import type { Transaction } from '../types/transaction';
import { buildReportsHtml } from '../utils/reportsPdf';
import type { ReportsPdfLabels } from '../utils/reportsPdf';
import { buildStatementHtml } from '../utils/statementPdf';
import type { StatementPdfLabels } from '../utils/statementPdf';
import { buildTransactionsCsv } from '../utils/csvExport';
import { getTransactionDate } from '../utils/transactionDate';

export type ReportsExportPdfLabels = ReportsPdfLabels & { exportPDF: string; error: string };
export type ReportsExportCsvLabels = { exportCSV: string; error: string };
export type ReportsExportStatementLabels = StatementPdfLabels & {
  downloadStatement: string;
  statementDownloaded: string;
  ok: string;
  error: string;
};

export async function exportReportsPdf(
  reports: ReportsData,
  labels: ReportsExportPdfLabels
): Promise<void> {
  const html = buildReportsHtml(reports, labels);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: labels.exportPDF });
  } else {
    Alert.alert(labels.exportPDF, `PDF saved: ${uri}`);
  }
}

export async function exportTransactionsCsv(
  transactions: Transaction[],
  labels: ReportsExportCsvLabels
): Promise<void> {
  const csv = buildTransactionsCsv(transactions);
  const filename = `mobiflow-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
  const uri = cacheDir ? `${cacheDir}${filename}` : filename;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: 'utf8' as any });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: labels.exportCSV });
  } else {
    Alert.alert(labels.exportCSV, `CSV saved: ${uri}`);
  }
}

export type StatementPeriod = '30days' | '3months' | '6months' | 'custom';

function getStatementDateRange(
  period: StatementPeriod,
  options: { startMonth?: Date; endMonth?: Date }
): { start: Date; end: Date } {
  if (period === 'custom' && options.startMonth != null && options.endMonth != null) {
    const start = new Date(options.startMonth);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(options.endMonth);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const now = new Date();
  const start = new Date(now);
  if (period === '30days') {
    start.setDate(start.getDate() - 29);
  } else if (period === '3months') {
    start.setMonth(start.getMonth() - 3);
  } else if (period === '6months') {
    start.setMonth(start.getMonth() - 6);
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function exportStatement(
  transactions: Transaction[],
  period: StatementPeriod,
  options: { startMonth?: Date; endMonth?: Date },
  labels: ReportsExportStatementLabels
): Promise<void> {
  const { start, end } = getStatementDateRange(period, options);
  const inPeriod = (t: Transaction) => {
    const d = getTransactionDate(t);
    return d != null && d >= start && d <= end;
  };
  const statementTx = transactions.filter(inPeriod);
  const startLabel = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const periodLabel = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  const html = buildStatementHtml(statementTx, periodLabel, labels);
  const { uri } = await Print.printToFileAsync({ html });

  try {
    const downloadsDir = FileSystem.documentDirectory + '../Downloads/';
    const filename = `MobiFlow_Statement_${start.toISOString().slice(0, 7)}_to_${end.toISOString().slice(0, 7)}.pdf`;
    const destUri = downloadsDir + filename;
    try {
      await FileSystem.copyAsync({ from: uri, to: destUri });
      Alert.alert(
        labels.downloadStatement,
        labels.statementDownloaded,
        [{ text: labels.ok }]
      );
    } catch {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: labels.downloadStatement,
        });
      } else {
        Alert.alert(labels.downloadStatement, `Statement saved: ${uri}`);
      }
    }
  } catch {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: labels.downloadStatement,
      });
    } else {
      Alert.alert(labels.downloadStatement, `Statement saved: ${uri}`);
    }
  }
}
