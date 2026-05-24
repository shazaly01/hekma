
-- Step 1: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;

-- Step 2: Add authenticated-only policy for full employee data (scoped to users with any app role)
CREATE POLICY "Authenticated users can view full employee data"
ON public.employees
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'data_entry'::app_role) OR
  has_role(auth.uid(), 'viewer'::app_role)
);

-- Step 3: Create a SECURITY DEFINER function that returns only safe public fields
-- This allows the public QR page to fetch limited employee info without auth
CREATE OR REPLACE FUNCTION public.get_public_employee(employee_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  photo_url text,
  department text,
  job_title text,
  employee_number text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id,
    e.name,
    e.photo_url,
    e.department,
    e.job_title,
    e.employee_number,
    e.status::text
  FROM public.employees e
  WHERE e.id = employee_id;
$$;
