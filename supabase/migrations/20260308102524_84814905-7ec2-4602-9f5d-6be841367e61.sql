-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- === employees ===
DROP POLICY IF EXISTS "select_employees" ON public.employees;
DROP POLICY IF EXISTS "insert_employees" ON public.employees;
DROP POLICY IF EXISTS "update_employees" ON public.employees;
DROP POLICY IF EXISTS "delete_employees" ON public.employees;

CREATE POLICY "select_employees" ON public.employees FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "insert_employees" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry'));
CREATE POLICY "update_employees" ON public.employees FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry'));
CREATE POLICY "delete_employees" ON public.employees FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === employee_cards ===
DROP POLICY IF EXISTS "select_employee_cards" ON public.employee_cards;
DROP POLICY IF EXISTS "insert_employee_cards" ON public.employee_cards;
DROP POLICY IF EXISTS "update_employee_cards" ON public.employee_cards;
DROP POLICY IF EXISTS "delete_employee_cards" ON public.employee_cards;

CREATE POLICY "select_employee_cards" ON public.employee_cards FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "insert_employee_cards" ON public.employee_cards FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry'));
CREATE POLICY "update_employee_cards" ON public.employee_cards FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry'));
CREATE POLICY "delete_employee_cards" ON public.employee_cards FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === employee_archives ===
DROP POLICY IF EXISTS "select_employee_archives" ON public.employee_archives;
DROP POLICY IF EXISTS "insert_employee_archives" ON public.employee_archives;
DROP POLICY IF EXISTS "delete_employee_archives" ON public.employee_archives;

CREATE POLICY "select_employee_archives" ON public.employee_archives FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "insert_employee_archives" ON public.employee_archives FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry'));
CREATE POLICY "delete_employee_archives" ON public.employee_archives FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === audit_logs ===
DROP POLICY IF EXISTS "select_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "insert_audit_logs" ON public.audit_logs;

CREATE POLICY "select_audit_logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "insert_audit_logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- === profiles ===
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- === user_roles ===
DROP POLICY IF EXISTS "select_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "admin_select_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_insert_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_update_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_delete_roles" ON public.user_roles;

CREATE POLICY "select_own_role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admin_select_all_roles" ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_roles" ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === departments ===
DROP POLICY IF EXISTS "select_departments" ON public.departments;
DROP POLICY IF EXISTS "admin_insert_departments" ON public.departments;
DROP POLICY IF EXISTS "admin_update_departments" ON public.departments;
DROP POLICY IF EXISTS "admin_delete_departments" ON public.departments;

CREATE POLICY "select_departments" ON public.departments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_departments" ON public.departments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_departments" ON public.departments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_departments" ON public.departments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === nationalities ===
DROP POLICY IF EXISTS "select_nationalities" ON public.nationalities;
DROP POLICY IF EXISTS "admin_insert_nationalities" ON public.nationalities;
DROP POLICY IF EXISTS "admin_update_nationalities" ON public.nationalities;
DROP POLICY IF EXISTS "admin_delete_nationalities" ON public.nationalities;

CREATE POLICY "select_nationalities" ON public.nationalities FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_nationalities" ON public.nationalities FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_nationalities" ON public.nationalities FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_nationalities" ON public.nationalities FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === job_titles ===
DROP POLICY IF EXISTS "select_job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "admin_insert_job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "admin_update_job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "admin_delete_job_titles" ON public.job_titles;

CREATE POLICY "select_job_titles" ON public.job_titles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_job_titles" ON public.job_titles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_job_titles" ON public.job_titles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_job_titles" ON public.job_titles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === card_types ===
DROP POLICY IF EXISTS "select_card_types" ON public.card_types;
DROP POLICY IF EXISTS "admin_insert_card_types" ON public.card_types;
DROP POLICY IF EXISTS "admin_update_card_types" ON public.card_types;
DROP POLICY IF EXISTS "admin_delete_card_types" ON public.card_types;

CREATE POLICY "select_card_types" ON public.card_types FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_card_types" ON public.card_types FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_card_types" ON public.card_types FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_card_types" ON public.card_types FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- === destruction_reasons ===
DROP POLICY IF EXISTS "select_destruction_reasons" ON public.destruction_reasons;
DROP POLICY IF EXISTS "admin_insert_destruction_reasons" ON public.destruction_reasons;
DROP POLICY IF EXISTS "admin_update_destruction_reasons" ON public.destruction_reasons;
DROP POLICY IF EXISTS "admin_delete_destruction_reasons" ON public.destruction_reasons;

CREATE POLICY "select_destruction_reasons" ON public.destruction_reasons FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'data_entry') OR has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_destruction_reasons" ON public.destruction_reasons FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_destruction_reasons" ON public.destruction_reasons FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_destruction_reasons" ON public.destruction_reasons FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));