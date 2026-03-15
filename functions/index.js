// Health score and report summary. Returns 200, 400, 401, or 500.
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

const COLLECTION = 'transactions';
const USERS_COLLECTION = 'users';
const SUPPORT_REQUESTS_COLLECTION = 'supportRequests';
const REGION = 'us-central1';
const RECENT_ACTIVITY_LIMIT = 50; // recent transactions returned to admin dashboard
const fn = functions.region(REGION);
const LESSON_LABELS = {
  'credit-score': 'Credit score',
  budgeting: 'Budgeting',
  'saving-percentages': 'Saving percentages',
  'loan-requirements': 'Loan requirements',
  'bank-trust': 'Bank trust',
};

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

async function getAdminUserIdFromRequest(req, res) {
  const userId = await getUserIdFromRequest(req, res);
  if (!userId) return null;
  try {
    const userSnap = await admin.firestore().collection(USERS_COLLECTION).doc(userId).get();
    if (!userSnap.exists || userSnap.data()?.isAdmin !== true) {
      res.status(403).json({ error: 'Admin access required', code: 403 });
      return null;
    }
    return userId;
  } catch (e) {
    console.error('Admin access check failed', e);
    res.status(500).json({ error: 'Server error', code: 500 });
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

function getUserCreatedDate(user) {
  const created = user.createdAt;
  if (!created) return null;
  if (created.toDate) return created.toDate();
  if (created.seconds) return new Date(created.seconds * 1000);
  const parsed = new Date(created);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCompletionDate(entry) {
  const completed = entry.completedAt;
  if (!completed) return null;
  if (completed.toDate) return completed.toDate();
  if (completed.seconds) return new Date(completed.seconds * 1000);
  return null;
}

function getDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function getDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function sortByNewest(items, field) {
  return items.sort((a, b) => {
    const aTime = a[field] ? new Date(a[field]).getTime() : 0;
    const bTime = b[field] ? new Date(b[field]).getTime() : 0;
    return bTime - aTime;
  });
}

function getAdminRangeMeta(dateRange, startDate, endDate) {
  if (dateRange === 'all') {
    return {
      key: 'all',
      label: 'All activity',
      days: 30,
      unbounded: true,
    };
  }
  if (dateRange === 'custom' && startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      const diffMs = end.getTime() - start.getTime();
      const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
      return {
        key: 'custom',
        label: `${startDate} to ${endDate}`,
        days,
        startMs: start.getTime(),
        endMs: end.getTime(),
      };
    }
  }
  if (dateRange === '7d') return { key: '7d', label: 'Last 7 days', days: 7 };
  if (dateRange === '90d') return { key: '90d', label: 'Last 90 days', days: 90 };
  return { key: '30d', label: 'Last 30 days', days: 30 };
}

function getChartLabel(date, totalDays) {
  if (totalDays <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function buildAdminOverview(adminUserId, filters = {}) {
  const db = admin.firestore();
  const [usersSnap, transactionsSnap, lessonCompletionsSnap, supportRequestsSnap] = await Promise.all([
    db.collection(USERS_COLLECTION).get(),
    db.collection(COLLECTION).get(),
    db.collectionGroup('lessonCompletions').get(),
    db.collection(SUPPORT_REQUESTS_COLLECTION).get(),
  ]);

  const rangeMeta = getAdminRangeMeta(filters.dateRange, filters.startDate, filters.endDate);
  const now = new Date();
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const rangeCutoffMs = rangeMeta.unbounded
    ? null
    : rangeMeta.startMs || nowMs - rangeMeta.days * dayMs;
  const rangeEndMs = rangeMeta.endMs || nowMs;
  const chartCutoffMs = rangeMeta.startMs || nowMs - (rangeMeta.days - 1) * dayMs;
  const userPhoneById = {};
  const dailyTransactionsMap = {};
  const dailyUsersMap = {};
  const dailyLessonCompletionsMap = {};
  const recentUserEvents = [];
  const adminAccountCandidates = [];
  let newUsersInRange = 0;
  const isWithinMetricRange = (timestampMs) =>
    timestampMs != null &&
    (rangeCutoffMs == null || timestampMs >= rangeCutoffMs) &&
    timestampMs <= rangeEndMs;
  const isWithinChartRange = (timestampMs) =>
    timestampMs != null && timestampMs >= chartCutoffMs && timestampMs <= rangeEndMs;

  usersSnap.forEach((doc) => {
    const data = doc.data() || {};
    userPhoneById[doc.id] = data.phone || 'Unknown user';
    if (data.isAdmin === true) {
      adminAccountCandidates.push({
        uid: doc.id,
        phone: data.phone || '',
      });
    }
    const createdAt = getUserCreatedDate(data);
    if (createdAt && isWithinMetricRange(createdAt.getTime())) {
      recentUserEvents.push({
        id: `user-${doc.id}`,
        type: 'user',
        title: 'New user',
        detail: data.phone || 'Unknown user',
        createdAt: createdAt.toISOString(),
      });
    }
    if (createdAt && isWithinMetricRange(createdAt.getTime())) {
      newUsersInRange += 1;
    }
    if (createdAt && isWithinChartRange(createdAt.getTime())) {
      dailyUsersMap[getDayKey(createdAt)] = (dailyUsersMap[getDayKey(createdAt)] || 0) + 1;
    }
  });

  const adminAccounts = await Promise.all(
    adminAccountCandidates.map(async (item) => {
      try {
        const userRecord = await admin.auth().getUser(item.uid);
        return {
          uid: item.uid,
          email: userRecord.email || '',
          phone: item.phone || '',
          disabled: userRecord.disabled === true,
          lastSignInTime: userRecord.metadata.lastSignInTime || null,
        };
      } catch (error) {
        return {
          uid: item.uid,
          email: '',
          phone: item.phone || '',
          disabled: false,
          lastSignInTime: null,
        };
      }
    })
  );

  let transactionsInRange = 0;
  const activeUsersInRange = new Set();
  const transactionsInRangeList = [];
  transactionsSnap.forEach((doc) => {
    const data = doc.data() || {};
    const created = data.createdAt;
    let createdMs = null;
    if (created?.toDate) createdMs = created.toDate().getTime();
    else if (created?.seconds) createdMs = created.seconds * 1000;
    if (isWithinMetricRange(createdMs)) {
      transactionsInRange += 1;
      const createdDate = new Date(createdMs);
      if (data.userId) activeUsersInRange.add(data.userId);
      transactionsInRangeList.push({
        id: doc.id,
        userId: data.userId || '',
        phone: userPhoneById[data.userId] || 'Unknown user',
        label: data.label || '',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        type: data.type || '',
        category: data.category || '',
        createdAt: new Date(createdMs).toISOString(),
      });
    }
    if (isWithinChartRange(createdMs)) {
      const createdDate = new Date(createdMs);
      const dayKey = getDayKey(createdDate);
      dailyTransactionsMap[dayKey] = (dailyTransactionsMap[dayKey] || 0) + 1;
    }
  });

  let totalLessonCompletions = 0;
  const uniqueLessonLearners = new Set();
  const lessonCounts = {};
  const recentLessonCompletions = [];
  const lessonEvents = [];
  lessonCompletionsSnap.forEach((doc) => {
    const data = doc.data() || {};
    const userId = doc.ref.parent.parent ? doc.ref.parent.parent.id : '';
    const lessonId = doc.id;
    const lessonLabel = LESSON_LABELS[lessonId] || lessonId;
    const completedAt = getCompletionDate(data);
    const completedAtIso = completedAt ? completedAt.toISOString() : null;
    if (completedAt && isWithinMetricRange(completedAt.getTime())) {
      totalLessonCompletions += 1;
      if (completedAt && isWithinChartRange(completedAt.getTime())) {
        const dayKey = getDayKey(completedAt);
        dailyLessonCompletionsMap[dayKey] = (dailyLessonCompletionsMap[dayKey] || 0) + 1;
      }
      if (userId) uniqueLessonLearners.add(userId);
      lessonCounts[lessonId] = (lessonCounts[lessonId] || 0) + 1;
      recentLessonCompletions.push({
        id: `${userId || 'unknown'}-${lessonId}-${doc.id}`,
        lessonId,
        label: lessonLabel,
        phone: userPhoneById[userId] || 'Unknown user',
        completedAt: completedAtIso,
      });
      lessonEvents.push({
        id: `lesson-${userId || 'unknown'}-${lessonId}-${doc.id}`,
        type: 'lesson',
        title: lessonLabel,
        detail: userPhoneById[userId] || 'Unknown user',
        createdAt: completedAtIso,
      });
    }
  });

  const activityStart = rangeMeta.startMs ? new Date(rangeMeta.startMs) : new Date(chartCutoffMs);
  const dailyActivity = Array.from({ length: rangeMeta.days }, (_, index) => {
    const date = new Date(activityStart);
    date.setDate(activityStart.getDate() + index);
    const dayKey = getDayKey(date);
    return {
      label: getChartLabel(date, rangeMeta.days),
      transactions: dailyTransactionsMap[dayKey] || 0,
      newUsers: dailyUsersMap[dayKey] || 0,
      lessonCompletions: dailyLessonCompletionsMap[dayKey] || 0,
    };
  });

  const supportRequests = [];
  const supportEvents = [];
  let openSupportRequests = 0;
  supportRequestsSnap.forEach((doc) => {
    const data = doc.data() || {};
    const created = data.createdAt;
    let createdMs = null;
    if (created?.toDate) createdMs = created.toDate().getTime();
    else if (created?.seconds) createdMs = created.seconds * 1000;
    if (!isWithinMetricRange(createdMs)) {
      return;
    }

    const status = typeof data.status === 'string' ? data.status : 'open';
    const phone = typeof data.phone === 'string' && data.phone.trim() ? data.phone : 'Unknown user';
    const type = typeof data.type === 'string' ? data.type : 'support';
    const source = typeof data.source === 'string' ? data.source : 'mobile-app';
    const createdAt = createdMs != null ? new Date(createdMs).toISOString() : null;

    if (status === 'open') {
      openSupportRequests += 1;
    }

    supportRequests.push({
      id: doc.id,
      type,
      status,
      phone,
      source,
      createdAt,
    });
    supportEvents.push({
      id: `support-${doc.id}`,
      type: 'support',
      title: 'Password help request',
      detail: `${phone} · ${status}`,
      createdAt,
    });
  });

  const topLessons = Object.entries(lessonCounts)
    .map(([lessonId, count]) => ({
      lessonId,
      label: LESSON_LABELS[lessonId] || lessonId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const latestLessonCompletions = sortByNewest(recentLessonCompletions, 'completedAt').slice(0, 5);
  const recentActivity = sortByNewest(transactionsInRangeList, 'createdAt').slice(0, RECENT_ACTIVITY_LIMIT);
  const recentSupportRequests = sortByNewest(supportRequests, 'createdAt').slice(0, 20);
  const transactionEvents = recentActivity.map((item) => ({
    id: `transaction-${item.id}`,
    type: 'transaction',
    title: item.label || 'Transaction',
    detail: `${item.phone} · ${item.category || 'Other'}`,
    createdAt: item.createdAt,
  }));
  const activityFeed = sortByNewest(
    [...transactionEvents, ...lessonEvents, ...recentUserEvents, ...supportEvents].filter(
      (item) => item.createdAt
    ),
    'createdAt'
  ).slice(0, 20);

  return {
    totalUsers: usersSnap.size,
    totalTransactions: transactionsSnap.size,
    transactionsLast7Days: transactionsInRange,
    activeUsersLast7Days: activeUsersInRange.size,
    financials: {
      incomeTotal: 0,
      expenseTotal: 0,
      netTotal: 0,
    },
    period: {
      key: rangeMeta.key,
      label: rangeMeta.label,
      days: rangeMeta.days,
      newUsers: newUsersInRange,
      transactions: transactionsInRange,
      activeUsers: activeUsersInRange.size,
      lessonCompletions: totalLessonCompletions,
      openSupportRequests,
    },
    dailyActivity,
    learning: {
      totalLessonCompletions,
      uniqueLearners: uniqueLessonLearners.size,
      lessonCompletionsLast30Days: totalLessonCompletions,
      topLessons,
      recentCompletions: latestLessonCompletions,
    },
    recentActivity,
    adminAccounts,
    supportRequests: recentSupportRequests,
    activityFeed,
    generatedAt: new Date().toISOString(),
    adminUserId,
  };
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

// Returns admin overview metrics and recent activity.
exports.getAdminOverview = fn.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed', code: 405 });
    return;
  }

  const adminUserId = await getAdminUserIdFromRequest(req, res);
  if (!adminUserId) return;

  try {
    const overview = await buildAdminOverview(adminUserId);
    res.status(200).json(overview);
  } catch (e) {
    console.error('getAdminOverview error', e);
    res.status(500).json({ error: 'Server error', code: 500 });
  }
});

exports.getAdminOverviewCallable = fn.https.onCall(async (data, context) => {
  const adminUserId = context.auth?.uid;
  if (!adminUserId) {
    throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');
  }
  const requestedRange = data && typeof data.dateRange === 'string' ? data.dateRange : 'all';
  const allowedRange =
    requestedRange === 'all' ||
    requestedRange === '7d' ||
    requestedRange === '30d' ||
    requestedRange === '90d' ||
    requestedRange === 'custom'
      ? requestedRange
      : '30d';
  const filters = {
    dateRange: allowedRange,
    startDate: data && typeof data.startDate === 'string' ? data.startDate : undefined,
    endDate: data && typeof data.endDate === 'string' ? data.endDate : undefined,
  };

  try {
    const userSnap = await admin.firestore().collection(USERS_COLLECTION).doc(adminUserId).get();
    if (!userSnap.exists || userSnap.data()?.isAdmin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    return await buildAdminOverview(adminUserId, filters);
  } catch (e) {
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    console.error('getAdminOverviewCallable error', e);
    throw new functions.https.HttpsError('internal', 'Server error');
  }
});
