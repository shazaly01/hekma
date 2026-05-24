import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { logAudit } from "./useAuditLog";

export type Employee = Tables<"employees">;
export type EmployeeInsert = TablesInsert<"employees">;
export type EmployeeUpdate = TablesUpdate<"employees">;

const PAGE_SIZE = 12;

export function useAllEmployees(search?: string, department?: string, section?: string) {
  return useQuery({
    queryKey: ["all-employees", search, department, section],
    queryFn: async () => {
      const { data } = await api.get('/employees/all', { params: { search, department, section } });
      return data as Employee[];
    },
  });
}

export function useEmployees(search?: string, department?: string, section?: string, page = 1) {
  return useQuery({
    queryKey: ["employees", search, department, section, page],
    queryFn: async () => {
      const { data } = await api.get('/employees', { params: { search, department, section, page, pageSize: PAGE_SIZE } });
      return data as { employees: Employee[], totalCount: number, pageSize: number };
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/employees/${id}`);
      return data as Employee;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: EmployeeInsert) => {
      const { data } = await api.post('/employees', employee);
      logAudit("create", "employee", data.id, { name: data.name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeUpdate & { id: string }) => {
      const { data } = await api.put(`/employees/${id}`, updates);
      logAudit("update", "employee", id, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
      logAudit("delete", "employee", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

