
-- Drop ALL existing policies
DROP POLICY IF EXISTS "Authenticated users can view full employee data" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;

DROP POLICY IF EXISTS "Authenticated can view employee_cards" ON public.employee_cards;
DROP POLICY IF EXISTS "Admin/data_entry can insert employee_cards" ON public.employee_cards;
DROP POLICY IF EXISTS "Admin/data_entry can update employee_cards" ON public.employee_cards;
DROP POLICY IF EXISTS "Admins can delete employee_cards" ON public.employee_cards;

DROP POLICY IF EXISTS "Authenticated can view archives" ON public.employee_archives;
DROP POLICY IF EXISTS "Authenticated can upload archives" ON public.employee_archives;
DROP POLICY IF EXISTS "Only admins can delete archives" ON public.employee_archives;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can update departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can delete departments" ON public.departments;

DROP POLICY IF EXISTS "Anyone authenticated can view nationalities" ON public.nationalities;
DROP POLICY IF EXISTS "Admins can insert nationalities" ON public.nationalities;
DROP POLICY IF EXISTS "Admins can update nationalities" ON public.nationalities;
DROP POLICY IF EXISTS "Admins can delete nationalities" ON public.nationalities;

DROP POLICY IF EXISTS "Anyone authenticated can view job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "Admins can insert job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "Admins can update job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "Admins can delete job_titles" ON public.job_titles;

DROP POLICY IF EXISTS "Anyone authenticated can view card_types" ON public.card_types;
DROP POLICY IF EXISTS "Admins can insert card_types" ON public.card_types;
DROP POLICY IF EXISTS "Admins can update card_types" ON public.card_types;
DROP POLICY IF EXISTS "Admins can delete card_types" ON public.card_types;

DROP POLICY IF EXISTS "Anyone authenticated can view destruction_reasons" ON public.destruction_reasons;
DROP POLICY IF EXISTS "Admins can insert destruction_reasons" ON public.destruction_reasons;
DROP POLICY IF EXISTS "Admins can update destruction_reasons" ON public.destruction_reasons;
DROP POLICY IF EXISTS "Admins can delete destruction_reasons" ON public.destruction_reasons;

-- EMPLOYEES (PERMISSIVE, TO authenticated)
CREATE POLICY "select_employees" ON public.employees FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "insert_employees" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry'));
CREATE POLICY "update_employees" ON public.employees FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry'));
CREATE POLICY "delete_employees" ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEE_CARDS
CREATE POLICY "select_employee_cards" ON public.employee_cards FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "insert_employee_cards" ON public.employee_cards FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry'));
CREATE POLICY "update_employee_cards" ON public.employee_cards FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry'));
CREATE POLICY "delete_employee_cards" ON public.employee_cards FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEE_ARCHIVES
CREATE POLICY "select_employee_archives" ON public.employee_archives FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "insert_employee_archives" ON public.employee_archives FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry'));
CREATE POLICY "delete_employee_archives" ON public.employee_archives FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- AUDIT_LOGS
CREATE POLICY "select_audit_logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert_audit_logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- PROFILES
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- USER_ROLES
CREATE POLICY "select_own_role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admin_select_all_roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DEPARTMENTS
CREATE POLICY "select_departments" ON public.departments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_departments" ON public.departments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_departments" ON public.departments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_departments" ON public.departments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- NATIONALITIES
CREATE POLICY "select_nationalities" ON public.nationalities FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_nationalities" ON public.nationalities FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_nationalities" ON public.nationalities FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_nationalities" ON public.nationalities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- JOB_TITLES
CREATE POLICY "select_job_titles" ON public.job_titles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_job_titles" ON public.job_titles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_job_titles" ON public.job_titles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_job_titles" ON public.job_titles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- CARD_TYPES
CREATE POLICY "select_card_types" ON public.card_types FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_card_types" ON public.card_types FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_card_types" ON public.card_types FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_card_types" ON public.card_types FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DESTRUCTION_REASONS
CREATE POLICY "select_destruction_reasons" ON public.destruction_reasons FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'viewer'));
CREATE POLICY "admin_insert_destruction_reasons" ON public.destruction_reasons FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_destruction_reasons" ON public.destruction_reasons FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_destruction_reasons" ON public.destruction_reasons FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
