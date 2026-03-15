import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { AppColors } from '../constants/colors';
import { ui } from '../styles/ui';
import brandIcon from '../../../mobiflow-app/assets/images/app-icon.png';

export function LoginPage() {
  const { user, isAdmin, loading, error, signIn, clearError } = useAdminAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (!loading && user && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await signIn(identifier, password);
    setSubmitting(false);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--page-bg)] px-6 py-10">
      <div className="w-full max-w-[430px]">
        <div className={`${ui.panel} overflow-hidden rounded-[30px] border border-(--border-muted) bg-[var(--panel-bg)] shadow-[0_24px_80px_rgba(17,24,39,0.1)]`}>
          <div className="border-b border-(--border-muted) bg-[var(--panel-soft)] px-8 py-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <img src={brandIcon} alt="MobiFlow" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                <h1 className="text-[15px] font-semibold leading-none text-(--text-main)">MobiFlow</h1>
              </div>
              <p className="mt-2 text-[11px] text-(--text-soft)">Admin</p>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="text-center">
              <h2 className="text-[22px] font-semibold text-(--text-main)">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                Use your admin email and password.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} autoComplete="off">
              <label className="grid gap-2 text-sm font-medium text-(--text-main)">
                <span>Email address</span>
                <input
                  type="email"
                  name="admin-email"
                  placeholder="admin@mobiflow.com"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="off"
                  inputMode="email"
                  spellCheck={false}
                  className={ui.input}
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-(--text-main)">
                <span>Password</span>
                <input
                  type="password"
                  name="admin-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className={ui.input}
                />
              </label>

              {error ? (
                <p
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: `${AppColors.error}40`,
                    backgroundColor: `${AppColors.error}12`,
                    color: AppColors.error,
                  }}>
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: AppColors.accent }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = AppColors.accentHover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = AppColors.accent;
                }}
                disabled={submitting || loading}>
                {submitting || loading ? 'Signing in...' : 'Open dashboard'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3 text-center text-xs text-(--text-muted)">
              Only approved admin accounts can access this dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
