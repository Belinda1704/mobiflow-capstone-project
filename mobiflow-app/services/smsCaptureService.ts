// Read MoMo/Airtel SMS, parse to transactions, save to Firestore. Android only.
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  startReadSMS,
  stopReadSMS,
  checkIfHasSMSPermission,
  requestReadSMSPermission,
  readPastSMS,
  readPastSentSMS,
} from '@maniac-tech/react-native-expo-read-sms';
import { parseSmsTransaction } from './smsParserService';
import { addTransaction, getTransactionsSnapshot } from './transactionsService';
import { recordTransactionCompleted } from './notificationTriggerService';
import { suggestCategory } from './categorySuggestionService';
import { learnSmsPattern } from './smsPatternService';
import type { Transaction } from '../types/transaction';

let isListenerActive = false;
let cachedTransactions: Transaction[] = []; // Used when suggesting a category for new SMS

const DEDUPE_WINDOW_MS = 2 * 60 * 1000; // 2 min – don’t add the same transaction twice
const recentSmsAdds: { label: string; amount: number; type: string; time: number }[] = [];
const recentSmsBodies: { body: string; address: string; time: number }[] = [];

// Strip trailing phone in parens for dedupe
function normalizeLabelForSignature(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDuplicateSmsTransaction(label: string, amount: number, type: string): boolean {
  const now = Date.now();
  const cutoff = now - DEDUPE_WINDOW_MS;
  while (recentSmsAdds.length > 0 && recentSmsAdds[0].time < cutoff) {
    recentSmsAdds.shift();
  }
  const normalizedLabel = label.trim().toLowerCase();
  return recentSmsAdds.some(
    (r) =>
      r.amount === amount &&
      r.type === type &&
      r.time >= cutoff &&
      r.label.trim().toLowerCase() === normalizedLabel
  );
}

function recordSmsTransactionAdded(label: string, amount: number, type: string): void {
  recentSmsAdds.push({
    label,
    amount,
    type,
    time: Date.now(),
  });
  if (recentSmsAdds.length > 50) {
    recentSmsAdds.splice(0, recentSmsAdds.length - 20);
  }
}

function isDuplicateSmsBody(body: string, address: string): boolean {
  const now = Date.now();
  const cutoff = now - DEDUPE_WINDOW_MS;
  while (recentSmsBodies.length > 0 && recentSmsBodies[0].time < cutoff) {
    recentSmsBodies.shift();
  }
  const normalizedBody = body.trim().toLowerCase();
  const normalizedAddress = address.trim().toLowerCase();
  return recentSmsBodies.some(
    (r) =>
      r.time >= cutoff &&
      r.body.trim().toLowerCase() === normalizedBody &&
      r.address.trim().toLowerCase() === normalizedAddress
  );
}

function recordSmsBodyProcessed(body: string, address: string): void {
  recentSmsBodies.push({
    body,
    address,
    time: Date.now(),
  });
  if (recentSmsBodies.length > 50) {
    recentSmsBodies.splice(0, recentSmsBodies.length - 20);
  }
}

// Stable id so same SMS not added twice (includes timestamp so live vs past can differ)
function computeSmsId(body: string, address: string, timestamp: number): string {
  const raw = `${(body || '').trim()}|${(address || '').trim()}|${timestamp}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return 'sms_' + Math.abs(h).toString(36) + '_' + raw.length;
}

// Same for same body+address (no timestamp). Used so past scan skips SMS already added by live listener.
function computeSmsBodySig(body: string, address: string): string {
  const raw = `${(body || '').trim().toLowerCase()}|${(address || '').trim().toLowerCase()}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return 'b_' + Math.abs(h).toString(36);
}

// Payload from native can be string "[address, body]" or object { address, body }
function parseSmsPayload(payload: unknown): { address: string; body: string } | null {
  if (!payload) return null;

  if (typeof payload === 'object') {
    const maybe: any = payload;
    const address = (maybe.address ?? maybe.originatingAddress ?? '').toString().trim();
    const body = (maybe.body ?? maybe.message ?? maybe.text ?? '').toString().trim();
    if (!body) return null;
    return { address, body };
  }

  if (typeof payload !== 'string' || payload.length < 3) return null;
  const inner = payload.trim();
  if (!inner.startsWith('[') || !inner.endsWith(']')) return null;
  const content = inner.slice(1, -1);
  const commaIdx = content.indexOf(', ');
  if (commaIdx < 0) return null;
  return {
    address: content.slice(0, commaIdx).trim(),
    body: content.slice(commaIdx + 2).trim(),
  };
}

// Looks like mobile money SMS (MTN, Airtel, RWF).
function isMobileMoneySms(body: string): boolean {
  const lower = body.toLowerCase();
  return (
    lower.includes('momo') ||
    lower.includes('mtn') ||
    lower.includes('m-money') ||
    lower.includes('airtel') ||
    lower.includes('*165*') || // USSD transfer format
    (lower.includes('rwf') && (
      lower.includes('received') ||
      lower.includes('sent') ||
      lower.includes('recu') ||
      lower.includes('envoye') ||
      lower.includes('transferred') ||
      lower.includes('transfer')
    ))
  );
}

export async function checkSmsPermissions(): Promise<{ hasReceiveSms: boolean; hasReadSms: boolean }> {
  if (Platform.OS !== 'android') {
    return { hasReceiveSms: false, hasReadSms: false };
  }
  const r = await checkIfHasSMSPermission();
  return {
    hasReceiveSms: r.hasReceiveSmsPermission,
    hasReadSms: r.hasReadSmsPermission,
  };
}

// Ask SMS permission (system dialog).
export async function requestSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await requestReadSMSPermission();
    if (granted) return true;
  } catch {
    // Fallback: PermissionsAndroid
  }
  try {
    const read = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      { title: 'SMS access for MobiFlow', message: 'MobiFlow needs to read mobile money SMS to add transactions automatically.', buttonPositive: 'Allow' }
    );
    const receive = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      { title: 'Receive SMS for MobiFlow', message: 'Allow MobiFlow to receive SMS for MTN MoMo and Airtel Money.', buttonPositive: 'Allow' }
    );
    return read === PermissionsAndroid.RESULTS.GRANTED && receive === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function isSmsCaptureSupported(): boolean {
  return Platform.OS === 'android';
}

// Refresh cache when transactions change (for category suggestion).
export function updateCachedTransactions(transactions: Transaction[]): void {
  cachedTransactions = transactions;
}

export type ProcessSmsResult = { added: boolean };

// Parse SMS, suggest category, add to Firestore if not already there (by smsId).
async function processSmsMessage(
  smsBody: string,
  smsAddress: string,
  smsTimestamp: number,
  userId: string,
  onTransactionAdded?: () => void,
  existingSmsIds?: Set<string> // Past scan: caller’s ids; live: from cache.
): Promise<ProcessSmsResult> {
  const smsId = computeSmsId(smsBody, smsAddress, smsTimestamp);
  console.log('[SMS Capture] Processing SMS:', { address: smsAddress, smsId: smsId.substring(0, 20) });

  // Past scan: dedupe by smsId. Live: dedupe by recent body only so new messages are not skipped.
  const idsToCheck = existingSmsIds ?? null;
  if (idsToCheck && idsToCheck.has(smsId)) {
    console.log('[SMS Capture] Skipping - transaction with this smsId already exists:', smsId.substring(0, 20));
    return { added: false };
  }

  if (!existingSmsIds && isDuplicateSmsBody(smsBody, smsAddress)) {
    console.log('[SMS Capture] Skipping duplicate SMS body (already processed recently):', smsBody.substring(0, 50));
    return { added: false };
  }

  if (!isMobileMoneySms(smsBody)) {
    console.log('[SMS Capture] Not a mobile money SMS, skipping');
    return { added: false };
  }

  if (!existingSmsIds) {
    recordSmsBodyProcessed(smsBody, smsAddress);
  }

  const tx = parseSmsTransaction(smsBody);
  if (!tx) {
    console.log('[SMS Capture] Failed to parse transaction from SMS body');
    return { added: false };
  }
  console.log('[SMS Capture] Parsed transaction:', { label: tx.label, amount: tx.amount, type: tx.type });

  let suggestedCategory = 'Other';
  try {
    const suggestion = await suggestCategory(
      userId,
      tx.label,
      tx.type,
      cachedTransactions
    );
    if (suggestion) {
      suggestedCategory = suggestion.category;
      console.log(`Category suggested "${tx.label}" -> "${suggestedCategory}"`);
    }
  } catch (error) {
    console.warn('Category suggestion failed, using default:', error);
  }

  try {
    await learnSmsPattern(smsBody, tx);
  } catch (error) {
    console.warn('Failed to learn SMS pattern:', error);
  }

  const bodySig = computeSmsBodySig(smsBody, smsAddress);
  console.log('[SMS Capture] Adding transaction:', { label: tx.label, amount: tx.amount, type: tx.type, category: suggestedCategory });
  try {
    await addTransaction(userId, {
      label: tx.label,
      amount: tx.amount,
      type: tx.type,
      category: suggestedCategory,
      paymentMethod: 'mobile_money',
      notes: `SMS: ${tx.provider}`,
      createdAt: new Date(smsTimestamp),
      smsId,
      smsBodySig: bodySig,
    });
    console.log('[SMS Capture] Transaction added successfully:', tx.label);
    // Past scan: track just-added ids in same batch
    if (existingSmsIds) {
      existingSmsIds.add(smsId);
    }
    recordSmsTransactionAdded(tx.label, tx.amount, tx.type);
    recordTransactionCompleted(userId, tx.label, Math.abs(tx.amount)).catch(() => {});
    cachedTransactions = [
      {
        id: 'temp',
        userId,
        label: tx.label,
        amount: tx.amount,
        type: tx.type,
        category: suggestedCategory,
        paymentMethod: 'mobile_money',
        notes: `SMS: ${tx.provider}`,
        createdAt: null,
        smsId,
        smsBodySig: bodySig,
      },
      ...cachedTransactions,
    ];
    onTransactionAdded?.();
    return { added: true };
  } catch (error) {
    console.error('[SMS Capture] Failed to add transaction:', error);
    return { added: false };
  }
}

const PAST_SMS_SCANNED_KEY = '@mobiflow/pastSmsScannedForUserId';

// Clear flag so past SMS can be scanned again (e.g. after delete all).
export async function clearPastSmsScannedFlag(userId: string): Promise<void> {
  if (!userId) return;
  await AsyncStorage.removeItem(`${PAST_SMS_SCANNED_KEY}_${userId}`);
}

// Scan past SMS (inbox + sent), add as transactions. Once per user (flag).
export async function scanPastSmsMessages(
  userId: string,
  onProgress?: (processed: number, total: number) => void,
  onComplete?: (totalFound: number) => void,
  onError?: (err: string) => void,
  existingTransactionsFromCaller?: Transaction[]
): Promise<void> {
  if (Platform.OS !== 'android' || !userId) {
    console.log('[SMS Capture] Cannot scan past SMS - not Android or no userId');
    return;
  }

  try {
    const alreadyScanned = await AsyncStorage.getItem(`${PAST_SMS_SCANNED_KEY}_${userId}`);
    if (alreadyScanned === 'true') {
      console.log('[SMS Capture] Past SMS already scanned for this user, skipping to avoid duplicates');
      onComplete?.(0);
      return;
    }

    console.log('[SMS Capture] Starting to scan past SMS messages (inbox + sent)...');
    
    // Caller’s list or fetch (cache first)
    const existingTransactions =
      existingTransactionsFromCaller !== undefined
        ? existingTransactionsFromCaller
        : await getTransactionsSnapshot(userId);
    cachedTransactions = existingTransactions;

    const existingSmsIds = new Set<string>();
    const existingSmsBodySigs = new Set<string>();
    for (const tx of existingTransactions) {
      if (tx.smsId) existingSmsIds.add(tx.smsId);
      if (tx.smsBodySig) existingSmsBodySigs.add(tx.smsBodySig);
    }
    console.log(`[SMS Capture] Dedupe against ${existingSmsIds.size} smsIds and ${existingSmsBodySigs.size} body sigs`);

    // Read inbox + sent
    let pastSms: Array<{ body: string; address: string; timestamp: number }> = [];
    
    try {
      const [inboxSms, sentSms] = await Promise.all([
        readPastSMS(3000).catch((e) => {
          if (e?.message?.includes('readPastSMS') || e?.message?.includes('not a function')) return [];
          throw e;
        }),
        readPastSentSMS(3000).catch((e) => {
          if (e?.message?.includes('readPastSentSMS') || e?.message?.includes('not a function')) return [];
          console.warn('[SMS Capture] Could not read sent folder, continuing with inbox only:', e?.message);
          return [];
        }),
      ]);
      // Merge, sort newest first
      const combined = [...inboxSms, ...sentSms];
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      // Dedupe (can be in both)
      const seen = new Set<string>();
      pastSms = combined.filter((s) => {
        const key = `${s.body}|${s.address}|${s.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      console.log(`[SMS Capture] Read ${inboxSms.length} inbox + ${sentSms.length} sent = ${pastSms.length} unique past SMS`);
    } catch (nativeError: any) {
      console.error('[SMS Capture] Error reading past SMS:', nativeError);
      if (nativeError.message?.includes('readPastSMS') || nativeError.message?.includes('not a function')) {
        console.warn('[SMS Capture] readPastSMS not available - skipping past SMS scan');
        onError?.('Past SMS scanning requires native module update');
        return;
      }
      onError?.(nativeError.message || 'Failed to read past SMS');
      return;
    }

    const pastSmsToProcess: Array<{ body: string; address: string; timestamp: number }> = [];
    const batchSmsIds = new Set<string>();
    for (const sms of pastSms) {
      if (!isMobileMoneySms(sms.body)) continue;
      const smsIdForPast = computeSmsId(sms.body, sms.address, sms.timestamp);
      const bodySig = computeSmsBodySig(sms.body, sms.address);
      // Skip if already have (by smsId or by body sig – live listener uses different timestamp so body sig catches those)
      if (existingSmsIds.has(smsIdForPast) || existingSmsBodySigs.has(bodySig) || batchSmsIds.has(smsIdForPast)) continue;
      batchSmsIds.add(smsIdForPast);
      pastSmsToProcess.push(sms);
    }
    console.log(
      `[SMS Capture] Found ${pastSms.length} past SMS messages to inspect (${pastSmsToProcess.length} new by smsId)`
    );

    let processed = 0;
    let added = 0;

    for (const sms of pastSmsToProcess) {
      processed++;
      onProgress?.(processed, pastSmsToProcess.length);
      try {
        const result = await processSmsMessage(sms.body, sms.address, sms.timestamp, userId, undefined, existingSmsIds);
        if (result.added) added++;
      } catch (error) {
        console.warn(`[SMS Capture] Failed to process SMS ${processed}:`, error);
      }
    }
    
    console.log(`[SMS Capture] Past SMS scan complete: ${added} new transactions added from ${processed} unique transfers`);
    await AsyncStorage.setItem(`${PAST_SMS_SCANNED_KEY}_${userId}`, 'true');
    onComplete?.(added);
  } catch (error: any) {
    console.error('[SMS Capture] Error scanning past SMS:', error);
    onError?.(error.message || 'Failed to scan past SMS');
  }
}

// Listen for new SMS; parse, suggest category, add. First run: scan past once (then flag).
export function startSmsListener(
  userId: string,
  onTransactionAdded?: () => void,
  onError?: (err: string) => void,
  scanPastMessages: boolean = true
): void {
  if (Platform.OS !== 'android' || !userId) {
    console.log('[SMS Capture] Cannot start - not Android or no userId:', { platform: Platform.OS, userId });
    return;
  }
  if (isListenerActive) {
    console.log('[SMS Capture] Listener already active, skipping');
    return;
  }
  console.log('[SMS Capture] Starting SMS listener for userId:', userId);

  // Load transactions so past scan can dedupe
  getTransactionsSnapshot(userId).then((transactions) => {
    cachedTransactions = transactions;
    if (scanPastMessages) {
      console.log('[SMS Capture] Scanning past SMS messages (once per user)...');
      scanPastSmsMessages(
        userId,
        (processed, total) => {
          console.log(`[SMS Capture] Scanning: ${processed}/${total} SMS processed`);
        },
        (totalFound) => {
          console.log(`[SMS Capture] Past SMS scan complete: ${totalFound} transactions added`);
        },
        (err) => {
          console.warn('[SMS Capture] Past SMS scan error (continuing with listener):', err);
        },
        transactions
      );
    }
  }).catch((err) => {
    console.warn('Failed to load transactions for category suggestion:', err);
  });

  try {
    startReadSMS(async (status: string, smsPayload: unknown, err?: string) => {
      console.log('[SMS Capture] Received SMS event:', {
        status,
        hasPayload: !!smsPayload,
        payloadType: smsPayload === null ? 'null' : typeof smsPayload,
        err,
      });
      if (status === 'error') {
        console.error('[SMS Capture] Error:', err);
        onError?.(err ?? 'SMS capture error');
        return;
      }
      if (status !== 'success') {
        console.log('[SMS Capture] Skipping - status not success');
        return;
      }

      try {
        const direct = parseSmsPayload(smsPayload);
        if (direct && direct.body) {
          const address = direct.address || 'M-Money';
          console.log('[SMS Capture] Using direct payload from native bridge', {
            address,
            preview: direct.body.substring(0, 80),
          });

          if (!isMobileMoneySms(direct.body)) {
            console.log(
              '[SMS Capture] Direct payload is not mobile‑money SMS, skipping. Body:',
              direct.body.substring(0, 100)
            );
            return;
          }

          if (isDuplicateSmsBody(direct.body, address)) {
            console.log(
              '[SMS Capture] Skipping duplicate SMS body (already processed recently):',
              direct.body.substring(0, 80)
            );
            return;
          }

          // Record body only after add so new messages are not marked duplicate
          await processSmsMessage(direct.body, address, Date.now(), userId, onTransactionAdded);
          return;
        }

        // If payload failed to parse, read latest from inbox
        const inbox = await readPastSMS(20).catch((e) => {
          if (e?.message?.includes('readPastSMS') || e?.message?.includes('not a function')) {
            console.warn('[SMS Capture] readPastSMS not available for live listener');
            return [];
          }
          throw e;
        });

        if (!inbox || inbox.length === 0) {
          console.log('[SMS Capture] No inbox SMS found when live event fired');
          return;
        }

        const latest = inbox[0] as { body: string; address: string; timestamp: number };
        if (!latest.body) {
          console.log('[SMS Capture] Latest inbox SMS has no body, skipping');
          return;
        }

        if (!isMobileMoneySms(latest.body)) {
          console.log(
            '[SMS Capture] Live listener saw non‑mobile‑money SMS in inbox fallback, skipping. Body:',
            latest.body.substring(0, 100)
          );
          return;
        }

        if (isDuplicateSmsBody(latest.body, latest.address)) {
          console.log(
            '[SMS Capture] Skipping duplicate SMS body from inbox fallback (already processed recently):',
            latest.body.substring(0, 80)
          );
          return;
        }

        await processSmsMessage(
          latest.body,
          latest.address,
          latest.timestamp || Date.now(),
          userId,
          onTransactionAdded
        );
      } catch (listenerError) {
        console.error('[SMS Capture] Live listener processing error:', listenerError);
      }
    });
    isListenerActive = true;
    console.log('[SMS Capture] Listener started successfully');
  } catch (error) {
    console.error('[SMS Capture] Failed to start listener:', error);
    onError?.(String(error));
    isListenerActive = false;
  }
}

// Stop listener.
export function stopSmsListener(): void {
  if (Platform.OS === 'android' && isListenerActive) {
    console.log('[SMS Capture] Stopping listener');
    stopReadSMS();
    isListenerActive = false;
  }
}

// Listener running (for debugging).
export function isSmsListenerActive(): boolean {
  return isListenerActive;
}
