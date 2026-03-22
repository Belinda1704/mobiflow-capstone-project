import { useAdminOverviewContext } from '../context/AdminOverviewContext';

// Dashboard metrics from AdminOverviewProvider (cached; isRefreshing = background reload).
export function useAdminOverview() {
  return useAdminOverviewContext();
}
