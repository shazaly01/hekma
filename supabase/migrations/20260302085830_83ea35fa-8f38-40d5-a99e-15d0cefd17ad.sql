
-- Add length constraints to employees table columns
ALTER TABLE public.employees
  ALTER COLUMN name TYPE VARCHAR(100),
  ALTER COLUMN employee_number TYPE VARCHAR(50),
  ALTER COLUMN department TYPE VARCHAR(100),
  ALTER COLUMN job_title TYPE VARCHAR(100),
  ALTER COLUMN nationality TYPE VARCHAR(100),
  ALTER COLUMN passport_number TYPE VARCHAR(50),
  ALTER COLUMN card_number TYPE VARCHAR(50);

-- Add minimum length check for name
CREATE OR REPLACE FUNCTION public.validate_employee_name()
RETURNS TRIGGER AS $$
BEGIN
  IF length(trim(NEW.name)) < 2 THEN
    RAISE EXCEPTION 'Employee name must be at least 2 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_employee_name_length
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.validate_employee_name();
