
DROP FUNCTION IF EXISTS public.get_public_employee(uuid);

CREATE FUNCTION public.get_public_employee(employee_id uuid)
 RETURNS TABLE(id uuid, name text, photo_url text, department text, job_title text, employee_number text, status text, card_type_logo text)
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
    (
      SELECT ct.logo_url 
      FROM public.employee_cards ec
      JOIN public.card_types ct ON ct.id = ec.card_type_id
      WHERE ec.employee_id = e.id 
        AND (ec.is_destroyed IS NULL OR ec.is_destroyed = false)
      ORDER BY ec.created_at DESC
      LIMIT 1
    ) as card_type_logo
  FROM public.employees e
  WHERE e.id = employee_id;
$function$;
