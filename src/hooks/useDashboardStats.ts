import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  suspended_employees: number;
  valid_cards: number;
  expired_cards: number;
  destroyed_cards: number;
  expiring_this_month: number;
  new_employees_this_month: number;
  total_cards: number;
  card_renewal_rate: number;
  dept_distribution: { name: string; value: number }[];
  nat_distribution: { name: string; value: number }[];
  monthly_cards: { month: string; value: number }[];
  status_distribution: { name: string; value: number }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data as DashboardStats;
    },
  });
}

export interface ExpiryAlert {
  card_id: string;
  employee_id: string;
  employee_name: string;
  card_type_name: string;
  expiry_date: string;
  alert_type: "expired" | "expiring";
}

export function useExpiryAlerts() {
  return useQuery({
    queryKey: ["expiry-alerts"],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/expiry-alerts');
      return (data as ExpiryAlert[]) || [];
    },
  });
}
