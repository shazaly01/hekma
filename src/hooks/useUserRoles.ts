import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type UserRole = "admin" | "editor" | "data_entry" | "viewer";

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: UserRole | null;
  role_id: string | null;
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data } = await api.get('/users/roles');
      return data as UserWithRole[];
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: UserRole }) => {
      const { data } = await api.post('/users/roles/assign', { user_id, role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { data } = await api.post('/users/roles/remove', { user_id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role?: string }) => {
      // POST /auth/register is now protected (admin only) — token is auto-attached by api interceptor
      const { data } = await api.post('/auth/register', { email, password, role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { data } = await api.delete(`/users/${user_id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
}
