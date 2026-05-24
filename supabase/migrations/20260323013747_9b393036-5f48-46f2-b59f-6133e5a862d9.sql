
-- Fix 1: Restrict anon access to app_settings - hide PIN code values
DROP POLICY "anon_select_app_settings" ON public.app_settings;
CREATE POLICY "anon_select_app_settings" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key NOT IN ('global_pin_code'));

-- Admins can still read all settings including PIN
CREATE POLICY "admin_select_all_app_settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
