// Parse MTN/Airtel SMS → amount, type, label (incoming or past).

export type ParsedSmsTransaction = {
  amount: number;
  type: 'income' | 'expense';
  label: string;
  phoneNumber?: string;
  senderName?: string;
  provider: 'MTN' | 'Airtel' | 'unknown';
  rawSms: string;
};

// MTN MoMo: received RWF from 078...
const MTN_RECEIVED = /(?:received|recu|you have received)\s+(?:RWF|rwf)\s*([\d\s,]+)\s+from\s+(\+?25?0?\d{9})/i;
const MTN_SENT = /(?:sent|envoye|you have sent)\s+(?:RWF|rwf)\s*([\d\s,]+)\s+to\s+(\+?25?0?\d{9})/i;
// MTN with name instead of phone (greedy name so we get "John Mukiza" not "J")
const MTN_RECEIVED_NAME = /(?:received|recu|you have received)\s+([\d\s,]+)\s+(?:RWF|rwf)\s+from\s+([A-Za-z\s]+)(?:\s*\([^)]*\))?(?:\s+at|\s*\.|$)/i;
const MTN_SENT_NAME = /(?:sent|envoye|you have sent)\s+([\d\s,]+)\s+(?:RWF|rwf)\s+to\s+([A-Za-z\s]+)(?:\s*\([^)]*\))?(?:\s+at|\s*\.|$)/i;
// USSD transfer *165*S*AMOUNT RWF transferred to NAME...
const MTN_TRANSFERRED = /\*165\*(?:S\*)?([\d\s,]+)\s+(?:RWF|rwf)\s+transferred\s+to\s+([A-Za-z\s]+)(?:\s*\([^)]*\))?(?:\s+at|\s*\.|$)/i;
const MTN_TRANSFERRED_TO_NAME = /(?:transferred|transfer|you have transferred)\s+([\d\s,]+)\s+(?:RWF|rwf)\s+to\s+([A-Za-z\s]+)(?:\s*\([^)]*\))?(?:\s+at|\s*\.|$)/i;
const MTN_TRANSFERRED_AMOUNT_FIRST = /([\d\s,]+)\s+(?:RWF|rwf)\s+transferred\s+to\s+([A-Za-z\s]+)(?:\s*\([^)]*\))?(?:\s+at|\s*\.|$)/i;
// Airtel Money
const AIRTEL_RECEIVED = /(?:received|recu|you received)\s+(?:RWF|rwf)\s*([\d\s,]+)\s+from\s+(\+?25?0?\d{9})/i;
const AIRTEL_SENT = /(?:sent|envoye|you sent)\s+(?:RWF|rwf)\s*([\d\s,]+)\s+to\s+(\+?25?0?\d{9})/i;
const AIRTEL_RECEIVED_NAME = /(?:received|recu|you received)\s+([\d\s,]+)\s+(?:RWF|rwf)\s+from\s+([^(]+)(?:\s*\([^)]*\))?/i;
const AIRTEL_SENT_NAME = /(?:sent|envoye|you sent)\s+([\d\s,]+)\s+(?:RWF|rwf)\s+to\s+([^(]+)(?:\s*\([^)]*\))?/i;
// Fallback: received/sent + amount + RWF
const RWF_RECEIVED = /(?:received|recu|credit|credited)\s+([\d\s,]+)\s+(?:RWF|rwf)|(?:received|recu|credit|credited)\s+(?:RWF|rwf)\s*([\d\s,]+)/i;
const RWF_SENT = /(?:sent|envoye|debit|debited|paid|transferred)\s+([\d\s,]+)\s+(?:RWF|rwf)|(?:sent|envoye|debit|debited|paid|transferred)\s+(?:RWF|rwf)\s*([\d\s,]+)/i;
const RWF_AMOUNT = /(?:RWF|rwf)\s*([\d\s,]+)|([\d\s,]+)\s+(?:RWF|rwf)/gi;
// Relaxed name after from/to (for older or non-standard SMS); require at least 2 chars to avoid single-letter noise
const FROM_TO_NAME_LOOSE = /(?:from|to)\s+([A-Za-z][A-Za-z\s]{1,49})(?=\s+at\s|\s*\.|$|\s+\d)/i;
// Other common placements of name in SMS body (e.g. "Sender: John Mukiza", "From: John Mukiza")
const SENDER_LABEL = /(?:sender|from|name|sent by|received from)\s*:\s*([A-Za-z][A-Za-z\s]{1,49}?)(?=\s*\.|$|\s+Ref|\s+Date|\s+\d)/i;
const TO_LABEL = /(?:to|recipient)\s*:\s*([A-Za-z][A-Za-z\s]{1,49}?)(?=\s*\.|$|\s+Ref|\s+Date|\s+\d)/i;

function parseAmount(str: string): number {
  const cleaned = str.replace(/[\s,]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('250')) p = p.slice(3);
  else if (p.startsWith('0')) p = p;
  return p || phone;
}

function extractNameOrPhone(text: string): { name?: string; phoneNumber?: string } {
  const trimmed = text.trim();
  const phoneMatch = trimmed.match(/(\+?25?0?\d{9})/);
  if (phoneMatch) {
    return { phoneNumber: normalizePhone(phoneMatch[1]) };
  }
  // Name: strip parens and "at ..." timestamp
  let name = trimmed
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+at\s+.*$/i, '')
    .trim();

  if (name.length <= 2 && trimmed.includes('(')) {
    const beforeParen = trimmed.split('(')[0].trim();
    if (beforeParen.length > name.length) {
      name = beforeParen;
    }
  }
  
  return { name: name || undefined };
}

// Find a name in the SMS if main patterns missed it. Longest match with 2+ chars.
function scrapeNameFromBody(body: string, type: 'income' | 'expense'): string | undefined {
  const candidates: string[] = [];
  const fromTo = body.match(FROM_TO_NAME_LOOSE);
  if (fromTo?.[1]) candidates.push(fromTo[1].trim());
  const sender = body.match(SENDER_LABEL);
  if (sender?.[1]) candidates.push(sender[1].trim());
  const to = body.match(TO_LABEL);
  if (to?.[1]) candidates.push(to[1].trim());
  // Prefer "from" name for income and "to" name for expense when we have multiple
  const valid = candidates.filter((n) => n.length >= 2 && /[A-Za-z]{2,}/.test(n));
  if (valid.length === 0) return undefined;
  return valid.reduce((a, b) => (a.length >= b.length ? a : b));
}

export type ParseSmsOptions = { senderAddress?: string };

// Parse SMS → amount, type, label. null if not parseable. Pass senderAddress to use SMS sender when body has no phone.
export function parseSmsTransaction(sms: string, options?: ParseSmsOptions): ParsedSmsTransaction | null {
  const trimmed = sms.trim();
  if (!trimmed || trimmed.length < 10) return null;

  let amount = 0;
  let type: 'income' | 'expense' | null = null;
  let phoneNumber: string | undefined;
  let senderName: string | undefined;
  let provider: 'MTN' | 'Airtel' | 'unknown' = 'unknown';

  // MTN Pattern 1
  let m = trimmed.match(MTN_RECEIVED);
  if (m) {
    amount = parseAmount(m[1]);
    phoneNumber = normalizePhone(m[2]);
    type = 'income';
    provider = 'MTN';
  }
  if (!type) {
    m = trimmed.match(MTN_SENT);
    if (m) {
      amount = parseAmount(m[1]);
      phoneNumber = normalizePhone(m[2]);
      type = 'expense';
      provider = 'MTN';
    }
  }

  // MTN Pattern 2 (name)
  if (!type) {
    m = trimmed.match(MTN_RECEIVED_NAME);
    if (m && m[2]) {
      amount = parseAmount(m[1]);
      // Clean name
      let nameText = m[2].trim();
      // Trim
      nameText = nameText.replace(/\s+$/, '').trim();
      const nameOrPhone = extractNameOrPhone(nameText);
      senderName = nameOrPhone.name || nameText; // Use extracted name or fallback to cleaned text
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'income';
      provider = 'MTN';
    }
  }
  if (!type) {
    m = trimmed.match(MTN_SENT_NAME);
    if (m && m[2]) {
      amount = parseAmount(m[1]);
      let nameText = m[2].trim();
      nameText = nameText.replace(/\s+$/, '').trim();
      const nameOrPhone = extractNameOrPhone(nameText);
      senderName = nameOrPhone.name || nameText;
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'expense';
      provider = 'MTN';
    }
  }
  // MTN Pattern 3 (*165* transfer)
  if (!type) {
    m = trimmed.match(MTN_TRANSFERRED);
    if (m && m[2]) {
      amount = parseAmount(m[1]);
      let nameText = m[2].trim();
      nameText = nameText.replace(/\s+$/, '').trim();
      const nameOrPhone = extractNameOrPhone(nameText);
      senderName = nameOrPhone.name || nameText;
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'expense'; // Transfer is an expense (money going out)
      provider = 'MTN';
    }
  }
  // MTN Pattern 4 (transferred to)
  if (!type) {
    m = trimmed.match(MTN_TRANSFERRED_TO_NAME);
    if (m && m[2]) {
      amount = parseAmount(m[1]);
      let nameText = m[2].trim().replace(/\s+$/, '');
      const nameOrPhone = extractNameOrPhone(nameText);
      senderName = nameOrPhone.name || nameText;
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'expense';
      provider = 'MTN';
    }
  }
  if (!type) {
    m = trimmed.match(MTN_TRANSFERRED_AMOUNT_FIRST);
    if (m && m[2]) {
      amount = parseAmount(m[1]);
      let nameText = m[2].trim().replace(/\s+$/, '');
      const nameOrPhone = extractNameOrPhone(nameText);
      senderName = nameOrPhone.name || nameText;
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'expense';
      provider = 'MTN';
    }
  }

  // Airtel Pattern 1
  if (!type) {
    m = trimmed.match(AIRTEL_RECEIVED);
    if (m) {
      amount = parseAmount(m[1]);
      phoneNumber = normalizePhone(m[2]);
      type = 'income';
      provider = 'Airtel';
    }
  }
  if (!type) {
    m = trimmed.match(AIRTEL_SENT);
    if (m) {
      amount = parseAmount(m[1]);
      phoneNumber = normalizePhone(m[2]);
      type = 'expense';
      provider = 'Airtel';
    }
  }

  // Airtel Money - Pattern 2: amount before RWF with name
  if (!type) {
    m = trimmed.match(AIRTEL_RECEIVED_NAME);
    if (m) {
      amount = parseAmount(m[1]);
      const nameOrPhone = extractNameOrPhone(m[2]);
      senderName = nameOrPhone.name;
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'income';
      provider = 'Airtel';
    }
  }
  if (!type) {
    m = trimmed.match(AIRTEL_SENT_NAME);
    if (m) {
      amount = parseAmount(m[1]);
      const nameOrPhone = extractNameOrPhone(m[2]);
      senderName = nameOrPhone.name;
      phoneNumber = nameOrPhone.phoneNumber;
      type = 'expense';
      provider = 'Airtel';
    }
  }

  // Generic fallback
  if (!type) {
    m = trimmed.match(RWF_RECEIVED);
    if (m) {
      amount = parseAmount(m[1] || m[2]);
      type = 'income';
    }
  }
  if (!type) {
    m = trimmed.match(RWF_SENT);
    if (m) {
      amount = parseAmount(m[1] || m[2]);
      type = 'expense';
    }
  }

  if (!type || amount <= 0) return null;

  // Single-letter "names" are usually regex noise; ignore so we can try full-body scrape or address
  if (senderName && senderName.trim().length < 2) senderName = undefined;

  // Whenever we don't have a proper name, scrape the whole body (from/to, Sender:, From:, etc.)
  if (!senderName || senderName.length < 2) {
    const scraped = scrapeNameFromBody(trimmed, type);
    if (scraped && scraped.length >= 2) senderName = scraped;
  }

  // Use SMS sender address when body has no phone so we don't show "unknown sent"
  if (!phoneNumber && options?.senderAddress) {
    const addr = options.senderAddress.trim();
    const digits = addr.replace(/\D/g, '');
    if (digits.length >= 9) {
      phoneNumber = normalizePhone(digits.length >= 12 ? digits.slice(-9) : digits);
      if (phoneNumber.length < 9) phoneNumber = undefined;
    }
  }

  // Label: include phone when available for Top Customers
  let label: string;
  const displayPhone = phoneNumber ? (phoneNumber.length === 9 && !phoneNumber.startsWith('0') ? `0${phoneNumber}` : phoneNumber) : undefined;
  if (senderName && displayPhone) {
    label = type === 'income' ? `${senderName.trim()} from ${displayPhone}` : `${senderName.trim()} to ${displayPhone}`;
  } else if (senderName) {
    label = senderName.trim();
  } else if (displayPhone) {
    label = type === 'income' ? `${provider} from ${displayPhone}` : `${provider} to ${displayPhone}`;
  } else {
    label = type === 'income' ? `${provider} received` : `${provider} sent`;
  }

  return { amount, type, label, phoneNumber, senderName, provider, rawSms: trimmed };
}
