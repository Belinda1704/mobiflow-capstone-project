import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAdminAuth } from './AdminAuthContext';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#f5c518]" />
          <p className="text-sm text-neutral-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
