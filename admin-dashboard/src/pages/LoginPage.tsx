import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { AppColors } from '../constants/colors';
import { ui } from '../styles/ui';
import brandIcon from '../../../mobiflow-app/assets/images/app-icon.png';

export function LoginPage() {
  const { user, isAdmin, loading, error, signIn, requestPasswordReset, clearError } = useAdminAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (!loading && user && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResetSent(false);
    await signIn(identifier, password);
    setSubmitting(false);
  }

  async function handleForgotPassword() {
    setResetSending(true);
    setResetSent(false);
    const sent = await requestPasswordReset(identifier);
    setResetSent(sent);
    setResetSending(false);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-(--page-bg) px-6 py-10">
      <div className="w-full max-w-110">
        <div className={`${ui.panel} overflow-hidden rounded-3xl border border-(--border-muted) bg-(--panel-bg) shadow-[0_20px_60px_rgba(17,24,39,0.12)]`}>
          <div className="border-b border-(--border-muted) bg-(--panel-soft) px-8 py-7">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <img src={brandIcon} alt="MobiFlow" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-[#F5C518]/30" />
                <h1 className="text-base font-semibold leading-none text-(--text-main)">MobiFlow</h1>
              </div>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-(--text-soft)">Admin console</p>
            </div>
          </div>

          <div className="px-8 py-7">
            <div className="text-center">
              <h2 className="text-[24px] font-semibold text-(--text-main)">Sign in</h2>
              <p className="mt-2 text-sm text-(--text-muted)">
                Use your admin email and password to continue.
              </p>
            </div>

            <form className="mt-6 space-y-4.5" onSubmit={handleSubmit} autoComplete="off">
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="admin-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className={`${ui.input} w-full pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-(--text-soft) transition hover:text-(--text-main)"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {resetSent ? (
                <p className="rounded-xl border border-[#22C55E40] bg-[#22C55E12] px-4 py-3 text-sm text-[#15803D]">
                  Reset email sent. Check your inbox.
                </p>
              ) : null}

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
                {submitting || loading ? 'Signing in...' : 'Log in'}
              </button>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetSending || submitting || loading}
                  className="text-sm font-medium text-(--text-muted) underline underline-offset-2 transition hover:text-(--text-main) disabled:cursor-not-allowed disabled:opacity-60">
                  {resetSending ? 'Sending reset link...' : 'Forgot password?'}
                </button>
              </div>
            </form>

            <div className="mt-5 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3 text-center text-xs text-(--text-muted)">
              Access is limited to approved admin accounts.
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-(--text-soft)">
              <Link to="/terms" className="underline underline-offset-2 transition hover:text-(--text-main)">
                Terms
              </Link>
              <span aria-hidden>•</span>
              <Link to="/privacy-policy" className="underline underline-offset-2 transition hover:text-(--text-main)">
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
