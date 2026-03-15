import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AdminGuard } from './auth/AdminGuard';
import { AdminAuthProvider } from './auth/AdminAuthContext';
import { AdminShell } from './components/AdminShell';
import { AdminDateRangeProvider } from './filters/AdminDateRangeContext';
import { ActivityPage } from './pages/ActivityPage';
import { AdminAccountsPage } from './pages/AdminAccountsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LearningPage } from './pages/LearningPage';
import { LoginPage } from './pages/LoginPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportRequestsPage } from './pages/SupportRequestsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { UsersPage } from './pages/UsersPage';
import { ThemeProvider } from './theme/ThemeContext';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <AdminGuard>
                  <AdminDateRangeProvider>
                    <AdminShell />
                  </AdminDateRangeProvider>
                </AdminGuard>
              }>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/activity" element={<Navigate to="/insights" replace />} />
              <Route path="/insights" element={<ActivityPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/support-requests" element={<SupportRequestsPage />} />
              <Route path="/financial-literacy" element={<LearningPage />} />
              <Route path="/admin-accounts" element={<AdminAccountsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AdminAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
