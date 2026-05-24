import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Stripped Supabase realtime. We now rely on standard React Query invalidations
 * and window focus refetching.
 */
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Optionally setup SSE or WebSocket here in the future
    // Or just let ReactQuery do background refetches
  }, [queryClient]);
}
