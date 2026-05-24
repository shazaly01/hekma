import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { logAudit } from "@/hooks/useAuditLog";

export function useCardTypes() {
  return useQuery({
    queryKey: ["card-types"],
    queryFn: async () => {
      const { data } = await api.get('/card-types');
      return data;
    },
  });
}

export function useCardTypesAdmin() {
  return useQuery({
    queryKey: ["card-types-admin"],
    queryFn: async () => {
      const { data } = await api.get('/card-types/admin');
      return data;
    },
  });
}

export function useCreateCardType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; website_text?: string; back_instructions?: string; card_title?: string; company_name?: string }) => {
      const { data } = await api.post('/card-types', { 
        name: payload.name.trim(),
        website_text: payload.website_text,
        back_instructions: payload.back_instructions,
        card_title: payload.card_title,
        company_name: payload.company_name
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-types"] }),
  });
}

export function useUpdateCardType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; website_text?: string; back_instructions?: string; card_title?: string; company_name?: string }) => {
      const { data } = await api.put(`/card-types/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-types"] }),
  });
}

export function useDeleteCardType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/card-types/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-types"] }),
  });
}

export function useUpdateCardTypeLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, logo_url }: { id: string; logo_url: string }) => {
      const { data } = await api.put(`/card-types/${id}`, { logo_url });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-types"] }),
  });
}

// Destruction Reasons
export function useDestructionReasons() {
  return useQuery({
    queryKey: ["destruction-reasons"],
    queryFn: async () => {
      const { data } = await api.get('/destruction-reasons');
      return data;
    },
  });
}

export function useCreateDestructionReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/destruction-reasons', { name: name.trim() });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destruction-reasons"] }),
  });
}

export function useDeleteDestructionReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/destruction-reasons/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destruction-reasons"] }),
  });
}

// All Cards (for dashboard stats)
export function useAllCards() {
  return useQuery({
    queryKey: ["all-cards"],
    queryFn: async () => {
      const { data } = await api.get('/employee-cards/all');
      return data;
    },
  });
}

// Employee Cards
export function useEmployeeCards(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["employee-cards", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await api.get(`/employee-cards`, { params: { employee_id: employeeId } });
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployeeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (card: any) => {
      const { data } = await api.post('/employee-cards', card);
      
      logAudit("card_issued", "employee_card", data.id, {
        employee_id: card.employee_id,
        card_type_id: card.card_type_id,
        issue_type: card.issue_type,
        expiry_date: card.expiry_date,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["employee-cards", variables.employee_id] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployeeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employee_id, ...updates }: any) => {
      const { data } = await api.put(`/employee-cards/${id}`, updates);

      if (updates.is_destroyed) {
        logAudit("card_destroyed", "employee_card", id, {
          employee_id,
          destruction_reason_id: updates.destruction_reason_id,
          destruction_date: updates.destruction_date,
        });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["employee-cards", variables.employee_id] });
    },
  });
}

export function useDeleteEmployeeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employee_id }: { id: string; employee_id: string }) => {
      await api.delete(`/employee-cards/${id}`);
      logAudit("card_deleted", "employee_card", id, { employee_id });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["employee-cards", variables.employee_id] });
    },
  });
}
