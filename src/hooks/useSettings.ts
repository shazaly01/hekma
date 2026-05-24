import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { logAudit } from "./useAuditLog";

export function useDepartments() {
  return useQuery({
    queryKey: ["settings-departments"],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data as { id: string, name: string, color: string | null }[];
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const { data } = await api.post('/departments', { name: name.trim(), color });
      logAudit("create", "department", data.id, { name: data.name });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-departments"] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name?: string; color?: string }) => {
      const payload: any = {};
      if (name !== undefined) payload.name = name.trim();
      if (color !== undefined) payload.color = color;
      const { data } = await api.put(`/departments/${id}`, payload);
      logAudit("update", "department", id, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-departments"] }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
      logAudit("delete", "department", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-departments"] }),
  });
}

export function useSections() {
  return useQuery({
    queryKey: ["settings-sections"],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data as { id: string, name: string, department_id: string }[];
    },
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, department_id }: { name: string; department_id: string }) => {
      const { data } = await api.post('/sections', { name: name.trim(), department_id });
      logAudit("create", "section", data.id, { name: data.name, department_id });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-sections"] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, department_id }: { id: string; name: string; department_id: string }) => {
      const { data } = await api.put(`/sections/${id}`, { name: name.trim(), department_id });
      logAudit("update", "section", id, { name: name.trim(), department_id });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-sections"] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sections/${id}`);
      logAudit("delete", "section", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-sections"] }),
  });
}

export function useJobTitles() {
  return useQuery({
    queryKey: ["settings-job-titles"],
    queryFn: async () => {
      const { data } = await api.get('/job-titles');
      return data;
    },
  });
}

export function useCreateJobTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/job-titles', { name: name.trim() });
      logAudit("create", "job_title", data.id, { name: data.name });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-job-titles"] }),
  });
}

export function useUpdateJobTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put(`/job-titles/${id}`, { name: name.trim() });
      logAudit("update", "job_title", id, { name: name.trim() });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-job-titles"] }),
  });
}

export function useDeleteJobTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/job-titles/${id}`);
      logAudit("delete", "job_title", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-job-titles"] }),
  });
}

export function useNationalities() {
  return useQuery({
    queryKey: ["settings-nationalities"],
    queryFn: async () => {
      const { data } = await api.get('/nationalities');
      return data;
    },
  });
}

export function useCreateNationality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/nationalities', { name: name.trim() });
      logAudit("create", "nationality", data.id, { name: data.name });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-nationalities"] }),
  });
}

export function useUpdateNationality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put(`/nationalities/${id}`, { name: name.trim() });
      logAudit("update", "nationality", id, { name: name.trim() });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-nationalities"] }),
  });
}

export function useDeleteNationality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/nationalities/${id}`);
      logAudit("delete", "nationality", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-nationalities"] }),
  });
}
