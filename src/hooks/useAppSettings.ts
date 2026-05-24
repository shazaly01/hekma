import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAppSetting(key: string) {
  return useQuery({
    queryKey: ["app-settings", key],
    queryFn: async () => {
      const { data } = await api.get(`/app-settings/${key}`);
      const raw = data?.value;
      // Backend stores JSON, so `true` may come back as string "true"
      if (raw === "true") return true;
      if (raw === "false") return false;
      return raw;
    },
  });
}

export function useUpdateAppSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data } = await api.put(`/app-settings/${key}`, { value });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
}

export function useUpdateCardTypePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pin_enabled, pin_code }: { id: string; pin_enabled: boolean; pin_code: string | null }) => {
      const { data } = await api.put(`/card-types/${id}/pin`, { pin_enabled, pin_code });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card-types"] });
      qc.invalidateQueries({ queryKey: ["card-types-admin"] });
    },
  });
}
