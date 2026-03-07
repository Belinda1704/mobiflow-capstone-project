// Health score and report summary. Returns 200, 400, 401, or 500.
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const COLLECTION = 'transactions';
const REGION = 'us-central1';
const fn = functions.region(REGION);

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function getUserIdFromRequest(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token', code: 401 });
    return null;
  }
}

function getTransactionDate(t) {
  const created = t.createdAt;
  if (!created) return null;
  if (created.toDate) return created.toDate();
  if (created.seconds) return new Date(created.seconds * 1000);
  return null;
}

function filterByDateRange(transactions, dateRange) {
  if (!dateRange || dateRange === 'all') return transactions;
  const now = new Date();
  const cutoff = new Date(now);
  if (dateRange === 'week') {
    cutoff.setDate(cutoff.getDate() - 7);
  } else if (dateRange === 'month') {
    cutoff.setMonth(cutoff.getMonth() - 1);
  } else {
    return transactions;
  }
  return transactions.filter((t) => {
    const d = getTransactionDate(t);
    return d && d >= cutoff;
  });
}

// Returns health score (score, label, message).
exports.getHealthScore = fn.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', code: 405 });
    return;
  }

  const userId = await getUserIdFromRequest(req, res);
  if (!userId) return;

  try {
    const snapshot = await admin.firestore().collection(COLLECTION).where('userId', '==', userId).get();
    const transactions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpense = Math.abs(
      transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
    );
    const net = totalIncome - totalExpense;
    const count = transactions.length;

    const monthKeys = new Set();
    transactions.forEach((t) => {
      const d = getTransactionDate(t);
      if (d) monthKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const monthsData = monthKeys.size || 1;

    let score = 0;
    let label = 'No data';
    let message = 'Add at least 3 transactions to see your business health score.';

    const hasMin = count >= 3 && (totalIncome > 0 || totalExpense > 0);
    if (hasMin) {
      const avgIncome = totalIncome / monthsData;
      const avgExpense = totalExpense / monthsData;
      const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;
      const isPositive = net > 0;
      const runwayDays = avgExpense > 0 ? Math.floor((net / avgExpense) * 30) : 0;

      let ruleScore = 0;
      if (isPositive && net > 100) ruleScore += 40;
      else if (isPositive) ruleScore += 20;
      if (savingsRate > 15 && avgIncome > 1000) ruleScore += 30;
      else if (savingsRate > 5 && avgIncome > 1000) ruleScore += 20;
      else if (savingsRate > 0 && avgIncome > 1000) ruleScore += 10;
      if (runwayDays >= 60 && avgExpense > 1000) ruleScore += 15;
      else if (runwayDays >= 30 && avgExpense > 1000) ruleScore += 10;
      else if (runwayDays > 0 && avgExpense > 1000) ruleScore += 5;
      if (count >= 10) ruleScore += 5;

      score = Math.min(100, Math.max(0, Math.round(ruleScore)));
      if (score >= 80) {
        label = 'Excellent';
        message = 'Your business is thriving!';
      } else if (score >= 60) {
        label = 'Good';
        message = 'Your business is on track.';
      } else if (score >= 40) {
        label = 'Fair';
        message = 'Consider cutting expenses or increasing income.';
      } else {
        label = 'Needs attention';
        message = 'Focus on improving cash flow.';
      }
    }

    res.status(200).json({ score, label, message });
  } catch (e) {
    console.error('getHealthScore error', e);
    res.status(500).json({ error: 'Server error', code: 500 });
  }
});

// Returns report summary. Body can have dateRange: month, week, or all.
exports.getReportSummary = fn.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed', code: 405 });
    return;
  }

  const userId = await getUserIdFromRequest(req, res);
  if (!userId) return;

  let dateRange = 'month';
  if (req.method === 'POST' && req.body && typeof req.body.dateRange === 'string') {
    const dr = req.body.dateRange.toLowerCase();
    if (dr === 'week' || dr === 'month' || dr === 'all') dateRange = dr;
    else {
      res.status(400).json({ error: 'Invalid dateRange. Use week, month, or all.', code: 400 });
      return;
    }
  }

  try {
    const snapshot = await admin.firestore().collection(COLLECTION).where('userId', '==', userId).get();
    const transactions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = filterByDateRange(transactions, dateRange);

    const totalIncome = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpense = Math.abs(
      filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
    );
    const net = totalIncome - totalExpense;

    const byCategory = {};
    filtered.forEach((t) => {
      if (t.amount >= 0) return;
      const name = (t.category && t.category.trim()) || 'Other';
      if (!byCategory[name]) byCategory[name] = 0;
      byCategory[name] += Math.abs(t.amount);
    });
    const categories = Object.entries(byCategory).map(([name, amount]) => ({ name, amount }));

    res.status(200).json({
      totalIncome,
      totalExpense,
      net,
      categoryCount: categories.length,
      categories,
      dateRange,
    });
  } catch (e) {
    console.error('getReportSummary error', e);
    res.status(500).json({ error: 'Server error', code: 500 });
  }
});
