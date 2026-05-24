
DROP FUNCTION IF EXISTS public.get_public_employee(uuid);

CREATE FUNCTION public.get_public_employee(employee_id uuid)
 RETURNS TABLE(id uuid, name text, photo_url text, department text, job_title text, employee_number text, status text, card_type_logo text, card_type_name text, issue_date date, expiry_date date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    e.id,
    e.name,
    e.photo_url,
    e.department,
    e.job_title,
    e.employee_number,
    e.status::text,
    sub.logo_url as card_type_logo,
    sub.type_name as card_type_name,
    sub.issue_date,
    sub.expiry_date
  FROM public.employees e
  LEFT JOIN LATERAL (
    SELECT ct.logo_url, ct.name as type_name, ec.issue_date, ec.expiry_date
    FROM public.employee_cards ec
    JOIN public.card_types ct ON ct.id = ec.card_type_id
    WHERE ec.employee_id = e.id 
      AND (ec.is_destroyed IS NULL OR ec.is_destroyed = false)
    ORDER BY ec.created_at DESC
    LIMIT 1
  ) sub ON true
  WHERE e.id = employee_id;
$function$;
