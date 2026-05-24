
CREATE TABLE public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_qr_scans" ON public.qr_scans
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
