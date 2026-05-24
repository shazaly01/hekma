
-- Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view departments"
ON public.departments FOR SELECT
USING (true);

CREATE POLICY "Admins can insert departments"
ON public.departments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update departments"
ON public.departments FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete departments"
ON public.departments FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create job_titles table
CREATE TABLE public.job_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view job_titles"
ON public.job_titles FOR SELECT
USING (true);

CREATE POLICY "Admins can insert job_titles"
ON public.job_titles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update job_titles"
ON public.job_titles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete job_titles"
ON public.job_titles FOR DELETE
USING (has_role(auth.uid(), 'admin'));
