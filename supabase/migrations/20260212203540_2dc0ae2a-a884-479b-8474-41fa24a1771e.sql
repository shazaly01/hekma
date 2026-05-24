
-- Create nationalities table
CREATE TABLE public.nationalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nationalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nationalities" ON public.nationalities FOR SELECT USING (true);
CREATE POLICY "Admins can insert nationalities" ON public.nationalities FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update nationalities" ON public.nationalities FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete nationalities" ON public.nationalities FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default nationality
INSERT INTO public.nationalities (name) VALUES ('ليبي');

-- Add nationality column to employees
ALTER TABLE public.employees ADD COLUMN nationality TEXT;

-- Add unique constraint on employee_number (only for non-null values)
CREATE UNIQUE INDEX idx_employees_employee_number_unique ON public.employees (employee_number) WHERE employee_number IS NOT NULL;
