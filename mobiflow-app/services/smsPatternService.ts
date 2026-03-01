// Store SMS patterns to match similar messages later.
import type { ParsedSmsTransaction } from './smsParserService';

export type SMSFormatPattern = {
  pattern: string;
  provider: 'MTN' | 'Airtel' | 'unknown';
  formatType: 'received' | 'sent' | 'transferred';
  confidence: number;
  successCount: number;
  totalAttempts: number;
};

const STORAGE_KEY = '@mobiflow/learnedSmsPatterns';

export async function learnSmsPattern(
  sms: string,
  parsed: ParsedSmsTransaction
): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const patterns: SMSFormatPattern[] = existing ? JSON.parse(existing) : [];

    const features = extractSmsFeatures(sms);

    let pattern = patterns.find(
      (p) => p.provider === parsed.provider && p.formatType === (parsed.type === 'income' ? 'received' : 'sent')
    );

    if (pattern) {
      pattern.successCount++;
      pattern.totalAttempts++;
      pattern.confidence = pattern.successCount / pattern.totalAttempts;
      if (features.length > 0) {
        pattern.pattern = mergePatterns(pattern.pattern, features);
      }
    } else {
      const newPattern: SMSFormatPattern = {
        pattern: features.join('|'),
        provider: parsed.provider,
        formatType: parsed.type === 'income' ? 'received' : 'sent',
        confidence: 1.0,
        successCount: 1,
        totalAttempts: 1,
      };
      patterns.push(newPattern);
      pattern = newPattern;
    }

    patterns.sort((a, b) => b.confidence - a.confidence);
    const topPatterns = patterns.slice(0, 20);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(topPatterns));
  } catch (error) {
    console.warn('Failed to learn SMS pattern:', error);
  }
}

function extractSmsFeatures(sms: string): string[] {
  const features: string[] = [];
  const lower = sms.toLowerCase();

  if (lower.includes('received') || lower.includes('recu')) features.push('received');
  if (lower.includes('sent') || lower.includes('envoye')) features.push('sent');
  if (lower.includes('transferred') || lower.includes('transfer')) features.push('transferred');
  if (lower.includes('*165*')) features.push('ussd_format');
  if (lower.includes('rwf')) features.push('currency_rwf');
  if (lower.includes('momo') || lower.includes('mtn')) features.push('mtn_provider');
  if (lower.includes('airtel')) features.push('airtel_provider');
  if (lower.includes('from')) features.push('has_from');
  if (lower.includes('to')) features.push('has_to');
  if (lower.includes('balance')) features.push('has_balance');
  if (lower.includes('fee')) features.push('has_fee');
  if (lower.match(/\d{9,10}/)) features.push('has_phone');
  if (lower.match(/\d{4}-\d{2}-\d{2}/)) features.push('has_date_format');

  return features;
}

function mergePatterns(existing: string, newFeatures: string[]): string {
  const existingFeatures = existing.split('|');
  const combined = [...new Set([...existingFeatures, ...newFeatures])];
  return combined.join('|');
}

export async function getLearnedPatterns(
  provider: 'MTN' | 'Airtel'
): Promise<SMSFormatPattern[]> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const patterns: SMSFormatPattern[] = existing ? JSON.parse(existing) : [];
    return patterns.filter((p) => p.provider === provider && p.confidence > 0.5);
  } catch {
    return [];
  }
}
