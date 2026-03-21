import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarRange,
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  List,
  LogOut,
  Moon,
  ReceiptText,
  Search,
  Settings,
  Shield,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { useAdminDateRange, type AdminDateRange } from '../filters/AdminDateRangeContext';
import { fetchAdminOverview, type AdminOverview } from '../services/adminService';
import { ui } from '../styles/ui';
import { useTheme } from '../theme/ThemeContext';
import { formatAdminLabel, getAdminInitials } from '../utils/phone';
import brandIcon from '../../../mobiflow-app/assets/images/app-icon.png';

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Usage Insights', to: '/insights', icon: BarChart3 },
      { label: 'Activity Logs', to: '/logs', icon: List },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', to: '/users', icon: Users },
      { label: 'Transactions', to: '/transactions', icon: ReceiptText },
      { label: 'Support Requests', to: '/support-requests', icon: LifeBuoy },
    ],
  },
  {
    title: 'Insights',
    items: [{ label: 'Financial Literacy', to: '/financial-literacy', icon: BookOpen }],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Admin Accounts', to: '/admin-accounts', icon: Shield },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Aggregated platform metrics and activity.' },
  '/insights': { title: 'Usage Insights', subtitle: 'Platform events and behaviour trends.' },
  '/logs': { title: 'Activity Logs', subtitle: 'Chronological platform event history.' },
  '/users': { title: 'Users', subtitle: 'User adoption and activity overview.' },
  '/transactions': { title: 'Transactions', subtitle: 'Aggregated transaction trends.' },
  '/support-requests': {
    title: 'Support Requests',
    subtitle: 'Password help requests from mobile users.',
  },
  '/financial-literacy': {
    title: 'Financial Literacy',
    subtitle: 'Lesson engagement overview.',
  },
  '/admin-accounts': {
    title: 'Admin Accounts',
    subtitle: 'Approved accounts with dashboard access.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Workspace preferences and admin rules.',
  },
};

const sidebarLinkBase =
  'flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors';
const sidebarLinkActive =
  'bg-[#F5C518]/15 text-(--text-main) shadow-[inset_0_0_0_1px_rgba(245,197,24,0.2)]';
const sidebarLinkIdle = 'text-(--sidebar-link) hover:bg-(--sidebar-link-hover)';
const signOutButton =
  'w-full rounded-xl bg-[#F5C518] px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-[#E6B800]';
const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-muted) bg-(--panel-bg) text-(--text-muted) transition hover:bg-(--panel-soft)';
const dateRangeOptions: Array<{ value: AdminDateRange; label: string }> = [
  { value: 'all', label: 'All activity' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom range' },
];

export function AdminShell() {
  const { user, signOutAdmin } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const { dateRange, startDate, endDate, setDateRange, applyCustomRange } = useAdminDateRange();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(startDate || '');
  const [draftEndDate, setDraftEndDate] = useState(endDate || '');
  const dateMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<AdminOverview['activityFeed']>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const currentMeta = pageMeta[location.pathname] || pageMeta['/dashboard'];
  const adminName = formatAdminLabel(user?.email);
  const initials = getAdminInitials(adminName);
  const currentDateLabel =
    dateRange === 'custom' && startDate && endDate
      ? `${startDate} - ${endDate}`
      : dateRangeOptions.find((option) => option.value === dateRange)?.label || 'All activity';
  const searchableItems = useMemo(
    () =>
      navSections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          section: section.title,
        }))
      ),
    []
  );
  const filteredSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchableItems;
    return searchableItems.filter((item) => item.label.toLowerCase().includes(query));
  }, [searchQuery, searchableItems]);
  const notificationBadgeCount = Math.min(notifications.length, 9);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setIsDateMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setIsNotificationMenuOpen(false);
      }
      if (searchMenuRef.current && !searchMenuRef.current.contains(event.target as Node)) {
        setIsSearchMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (startDate) setDraftStartDate(startDate);
    if (endDate) setDraftEndDate(endDate);
  }, [endDate, startDate]);

  useEffect(() => {
    if (!isNotificationMenuOpen) return;

    let cancelled = false;
    async function loadNotifications() {
      setLoadingNotifications(true);
      setNotificationError(null);

      try {
        const overview = await fetchAdminOverview({ dateRange, startDate, endDate });
        if (!cancelled) {
          setNotifications(overview.activityFeed || []);
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationError(
            error instanceof Error && error.message.trim()
              ? error.message
              : 'Could not load notifications.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingNotifications(false);
        }
      }
    }

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [dateRange, endDate, isNotificationMenuOpen, startDate]);

  function formatNotificationTime(value: string | null) {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString();
  }

  return (
    <div className="grid h-screen overflow-hidden bg-(--page-bg) lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-x-0">
      <aside className="flex h-full flex-col border-r border-(--sidebar-border) bg-(--sidebar-bg) px-5 py-6 text-(--sidebar-link)">
        <div className="flex min-h-0 flex-1 flex-col gap-8">
          <div className="px-2">
            <div className="flex items-center gap-3">
              <img src={brandIcon} alt="MobiFlow" className="h-11 w-11 rounded-xl object-cover ring-1 ring-[#F5C518]/30" />
              <div className="flex flex-col justify-center">
                <h1 className="text-base font-semibold leading-none text-(--text-main)">MobiFlow</h1>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-(--sidebar-muted)">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.18em] text-(--sidebar-muted)">
                    {section.title}
                  </p>
                  <nav className="space-y-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            [sidebarLinkBase, isActive ? sidebarLinkActive : sidebarLinkIdle].join(' ')
                          }>
                          {({ isActive }) => (
                            <span className="flex items-center gap-3">
                              <Icon size={17} className={isActive ? 'text-[#F5C518]' : 'text-(--sidebar-muted)'} />
                              <span>{item.label}</span>
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-(--sidebar-border) pt-4">
          <div className="flex w-full items-center gap-3 rounded-xl border border-(--sidebar-border) bg-(--sidebar-link-hover) px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-sm font-semibold text-neutral-900">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-(--sidebar-muted)">Admin</p>
              <p className="truncate text-sm font-medium text-(--text-main)" title={adminName}>{adminName}</p>
            </div>
          </div>
          <button
            type="button"
            className={`${signOutButton} mt-3 flex w-full items-center justify-center gap-2`}
            onClick={() => void signOutAdmin()}>
            <LogOut size={16} className="shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex h-full min-w-0 flex-col overflow-y-auto bg-(--page-bg) px-5 py-5 lg:px-6">
        <header className="sticky top-0 z-20 mb-4 border-b border-(--border-muted) bg-(--page-bg)/90 px-5 py-4 backdrop-blur lg:px-6">
          <div className="w-full">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div ref={searchMenuRef} className="relative flex-1 lg:max-w-md">
                <div className="flex items-center gap-3 rounded-2xl border border-(--border-muted) bg-(--input-bg) px-4 py-3">
                  <Search size={18} className="text-(--text-soft)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setIsSearchMenuOpen(true);
                    }}
                    onFocus={() => setIsSearchMenuOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && filteredSearchItems.length) {
                        navigate(filteredSearchItems[0].to);
                        setIsSearchMenuOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    placeholder="Search pages..."
                    className="w-full border-none bg-transparent text-sm text-(--text-main) outline-none placeholder:text-(--text-soft)"
                  />
                </div>
                {isSearchMenuOpen ? (
                  <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-(--border-muted) bg-(--panel-bg) p-2 shadow-(--shadow-soft)">
                    {filteredSearchItems.length ? (
                      <div className="space-y-1">
                        {filteredSearchItems.slice(0, 6).map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.to}
                              type="button"
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-(--text-main) transition hover:bg-(--panel-soft)"
                              onClick={() => {
                                navigate(item.to);
                                setIsSearchMenuOpen(false);
                                setSearchQuery('');
                              }}>
                              <Icon size={16} className="text-(--text-soft)" />
                              <span className="flex-1">{item.label}</span>
                              <span className="text-xs uppercase tracking-[0.12em] text-(--text-soft)">
                                {item.section}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="px-3 py-2 text-sm text-(--text-muted)">No matching pages.</p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className={iconButton}
                  aria-label="Toggle theme"
                  onClick={toggleTheme}>
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <div ref={notificationMenuRef} className="relative">
                  <button
                    type="button"
                    className={iconButton}
                    aria-label="Notifications"
                    onClick={() => setIsNotificationMenuOpen((open) => !open)}>
                    <Bell size={18} />
                    {notificationBadgeCount ? (
                      <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                        {notifications.length > 9 ? '9+' : notificationBadgeCount}
                      </span>
                    ) : null}
                  </button>
                  {isNotificationMenuOpen ? (
                    <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-2xl border border-(--border-muted) bg-(--panel-bg) p-3 shadow-(--shadow-soft)">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-soft)">Notifications</p>
                          <p className="mt-1 text-sm font-medium text-(--text-main)">Recent activity</p>
                        </div>
                      </div>

                      {loadingNotifications ? <p className="text-sm text-(--text-muted)">Loading...</p> : null}
                      {notificationError ? <p className="text-sm text-rose-600">{notificationError}</p> : null}
                      {!loadingNotifications && !notificationError ? (
                        <div className="space-y-3">
                          {notifications.length ? (
                            notifications.slice(0, 5).map((item) => (
                              <div key={item.id} className="rounded-xl bg-(--panel-soft) px-3 py-3">
                                <p className="text-sm font-medium text-(--text-main)">{item.title}</p>
                                <p className="mt-1 text-sm text-(--text-muted)">{item.detail}</p>
                                <p className="mt-2 text-xs text-(--text-soft)">
                                  {formatNotificationTime(item.createdAt)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-(--text-muted)">No recent activity.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5c518] text-xs font-semibold text-neutral-900"
                  title={`Logged in as ${adminName}`}
                  aria-label={`Logged in as ${adminName}`}
                  role="img">
                  {user?.email ? initials : '?'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className={ui.sectionEyebrow}>Overview</p>
              <h2 className="mt-2 text-3xl font-semibold text-(--text-main)">{currentMeta.title}</h2>
              <p className="mt-2 text-sm text-(--text-muted)">{currentMeta.subtitle}</p>
            </div>
            <div ref={dateMenuRef} className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-(--border-muted) bg-(--panel-bg) px-3 py-2 text-sm font-medium text-(--text-main) shadow-(--shadow-soft) transition hover:bg-(--panel-soft)"
                onClick={() => setIsDateMenuOpen((open) => !open)}
                aria-label="Open date filter">
                <CalendarRange size={16} className="text-(--text-soft)" />
                <span>{currentDateLabel}</span>
                <ChevronDown size={16} className="text-(--text-soft)" />
              </button>

              {isDateMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 min-w-60 rounded-2xl border border-(--border-muted) bg-(--panel-bg) p-2 shadow-(--shadow-soft)">
                  <div className="space-y-1">
                    {dateRangeOptions.slice(0, 4).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                          dateRange === option.value
                            ? 'bg-(--panel-soft) font-medium text-(--text-main)'
                            : 'text-(--text-muted) hover:bg-(--panel-soft)'
                        }`}
                        onClick={() => {
                          setDateRange(option.value);
                          setIsDateMenuOpen(false);
                        }}>
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 rounded-xl border border-(--border-muted) bg-(--panel-soft) p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-soft)">Custom range</p>
                    <div className="mt-3 grid gap-3">
                      <label className="grid gap-1 text-xs font-medium text-(--text-muted)">
                        <span>Start date</span>
                        <input
                          type="date"
                          value={draftStartDate}
                          onChange={(event) => setDraftStartDate(event.target.value)}
                          className="rounded-lg border border-(--border-muted) bg-(--panel-bg) px-3 py-2 text-sm text-(--text-main) outline-none"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-medium text-(--text-muted)">
                        <span>End date</span>
                        <input
                          type="date"
                          value={draftEndDate}
                          onChange={(event) => setDraftEndDate(event.target.value)}
                          className="rounded-lg border border-(--border-muted) bg-(--panel-bg) px-3 py-2 text-sm text-(--text-main) outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        className="rounded-lg bg-[#f5c518] px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-[#e6b800] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!draftStartDate || !draftEndDate || draftStartDate > draftEndDate}
                        onClick={() => {
                          applyCustomRange(draftStartDate, draftEndDate);
                          setIsDateMenuOpen(false);
                        }}>
                        Apply range
                      </button>
                      {dateRange === 'custom' ? (
                        <button
                          type="button"
                          className="rounded-lg border border-(--border-muted) bg-(--panel-bg) px-3 py-2 text-sm font-medium text-(--text-muted) transition hover:bg-(--panel-bg)"
                          onClick={() => {
                            setDateRange('all');
                            setIsDateMenuOpen(false);
                          }}>
                          Clear custom range
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
