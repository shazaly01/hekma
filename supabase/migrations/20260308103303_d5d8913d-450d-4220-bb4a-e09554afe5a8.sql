-- Dashboard stats aggregate function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_employees', (SELECT count(*) FROM employees),
    'active_employees', (SELECT count(*) FROM employees WHERE status = 'active'),
    'suspended_employees', (SELECT count(*) FROM employees WHERE status = 'suspended'),
    'valid_cards', (SELECT count(*) FROM employee_cards WHERE (is_destroyed IS NULL OR is_destroyed = false) AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)),
    'expired_cards', (SELECT count(*) FROM employee_cards WHERE (is_destroyed IS NULL OR is_destroyed = false) AND expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE),
    'destroyed_cards', (SELECT count(*) FROM employee_cards WHERE is_destroyed = true),
    'dept_distribution', (SELECT coalesce(json_agg(row_to_json(d)), '[]'::json) FROM (SELECT coalesce(department, 'غير محدد') as name, count(*) as value FROM employees GROUP BY department ORDER BY count(*) DESC) d),
    'nat_distribution', (SELECT coalesce(json_agg(row_to_json(n)), '[]'::json) FROM (SELECT coalesce(nationality, 'غير محدد') as name, count(*) as value FROM employees GROUP BY nationality ORDER BY count(*) DESC) n)
  );
$$;

-- Expiry alerts: only cards expired or expiring within 30 days
CREATE OR REPLACE FUNCTION public.get_expiry_alerts()
RETURNS TABLE(
  card_id uuid,
  employee_id uuid,
  employee_name varchar,
  card_type_name text,
  expiry_date date,
  alert_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ec.id as card_id,
    ec.employee_id,
    e.name as employee_name,
    ct.name as card_type_name,
    ec.expiry_date,
    CASE
      WHEN ec.expiry_date < CURRENT_DATE THEN 'expired'
      ELSE 'expiring'
    END as alert_type
  FROM employee_cards ec
  JOIN employees e ON e.id = ec.employee_id
  JOIN card_types ct ON ct.id = ec.card_type_id
  WHERE (ec.is_destroyed IS NULL OR ec.is_destroyed = false)
    AND ec.expiry_date IS NOT NULL
    AND ec.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  ORDER BY
    CASE WHEN ec.expiry_date < CURRENT_DATE THEN 0 ELSE 1 END,
    ec.expiry_date ASC;
$$;