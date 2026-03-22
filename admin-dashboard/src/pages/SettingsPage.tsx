import {
  BookOpen,
  CalendarRange,
  Database,
  ExternalLink,
  LifeBuoy,
  Moon,
  Palette,
  ReceiptText,
  Shield,
  Sun,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { ui } from '../styles/ui';
import { useTheme } from '../theme/ThemeContext';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { dateRange, startDate, endDate } = useAdminDateRange();
  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);

  return (
    <section className="space-y-6">
      <div
        className={`${ui.panel} relative overflow-hidden border-(--border-strong) bg-linear-to-br from-(--panel-bg) via-(--panel-bg) to-[#F5C518]/08 p-6`}>
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F5C518]/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={ui.sectionEyebrow}>Workspace</p>
            <h2 className="mt-1 text-2xl font-semibold text-(--text-main)">How this dashboard works</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--text-muted)">
              Metrics come from the same secure cloud project as the MobiFlow mobile app. Use the{' '}
              <strong className="text-(--text-main)">date filter</strong> in the header to change the period for
              charts and totals across all pages.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3 text-sm font-semibold text-(--text-main) shadow-(--shadow-soft) transition hover:bg-(--panel-bg)">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={`${ui.panel} flex flex-col gap-4 p-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5C518]/18 text-[#B45309]">
              <Palette size={20} />
            </span>
            <div>
              <p className={ui.sectionEyebrow}>Appearance</p>
              <h3 className={ui.sectionTitle}>Theme</h3>
            </div>
          </div>
          <p className="text-sm text-(--text-muted)">
            Current theme: <strong className="text-(--text-main) capitalize">{theme}</strong>. Toggle above or use the
            moon/sun icon in the top bar.
          </p>
        </div>

        <div className={`${ui.panel} flex flex-col gap-4 p-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600">
              <CalendarRange size={20} />
            </span>
            <div>
              <p className={ui.sectionEyebrow}>Reporting</p>
              <h3 className={ui.sectionTitle}>Date scope</h3>
            </div>
          </div>
          <p className="text-sm text-(--text-muted)">
            Charts and KPIs use:{' '}
            <strong className="text-(--text-main)">{selectedPeriodLabel}</strong>. Change it from the calendar control
            next to the page title.
          </p>
        </div>

        <div className={`${ui.panel} flex flex-col gap-4 p-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
              <Shield size={20} />
            </span>
            <div>
              <p className={ui.sectionEyebrow}>Security</p>
              <h3 className={ui.sectionTitle}>Access</h3>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-(--text-muted)">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5C518]" />
              <span>
                <strong className="text-(--text-main)">Login:</strong> approved admin accounts only (Firebase Auth +
                admin flag).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5C518]" />
              <span>
                <strong className="text-(--text-main)">Password help:</strong> mobile users can request reset; you
                resolve tickets under Support Requests.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className={`${ui.panel} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-700">
              <Database size={20} />
            </span>
            <div>
              <p className={ui.sectionEyebrow}>Data sources</p>
              <h3 className="text-lg font-semibold text-(--text-main)">What powers these numbers</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--text-muted)">
                Aggregates come from <strong className="text-(--text-main)">Firestore</strong>: user profiles,
                transaction rows (amounts & categories only—no SMS body text), lesson completion records, and
                password-help requests. There is no connection to banks or credit bureaus.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ReceiptText, label: 'Transaction analytics', to: '/transactions', desc: 'Volume & trend' },
            { icon: BookOpen, label: 'Financial literacy', to: '/financial-literacy', desc: 'Lessons' },
            { icon: LifeBuoy, label: 'Support', to: '/support-requests', desc: 'Password help' },
            { icon: Shield, label: 'Admins', to: '/admin-accounts', desc: 'Console users' },
          ].map((item) => {
            const Icon = item.icon;
            return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3 transition hover:border-[#F5C518]/40 hover:bg-(--panel-bg)">
              <Icon size={18} className="text-(--text-soft) group-hover:text-[#B45309]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-(--text-main)">{item.label}</p>
                <p className="text-xs text-(--text-soft)">{item.desc}</p>
              </div>
              <ExternalLink size={14} className="shrink-0 text-(--text-soft) opacity-0 transition group-hover:opacity-100" />
            </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-(--text-soft)">
        <Link to="/terms" className="font-medium underline underline-offset-2 hover:text-(--text-main)">
          Terms of service
        </Link>
        <span aria-hidden>·</span>
        <Link to="/privacy-policy" className="font-medium underline underline-offset-2 hover:text-(--text-main)">
          Privacy policy
        </Link>
      </div>
    </section>
  );
}
