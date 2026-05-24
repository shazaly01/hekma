-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  entity_type text,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_notifications" ON public.notifications AS PERMISSIVE
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "update_own_notifications" ON public.notifications AS PERMISSIVE
FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "delete_own_notifications" ON public.notifications AS PERMISSIVE
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Service role inserts notifications, so no INSERT policy needed for users
-- But we need one for the edge function using service role (bypasses RLS)

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;