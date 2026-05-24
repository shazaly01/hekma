
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
    'expiring_this_month', (SELECT count(*) FROM employee_cards WHERE (is_destroyed IS NULL OR is_destroyed = false) AND expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date),
    'new_employees_this_month', (SELECT count(*) FROM employees WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'total_cards', (SELECT count(*) FROM employee_cards),
    'card_renewal_rate', (SELECT ROUND(COALESCE(count(*) FILTER (WHERE issue_type = 'renewal')::numeric / NULLIF(count(*), 0) * 100, 0)) FROM employee_cards),
    'dept_distribution', (SELECT coalesce(json_agg(row_to_json(d)), '[]'::json) FROM (SELECT coalesce(department, 'غير محدد') as name, count(*) as value FROM employees GROUP BY department ORDER BY count(*) DESC) d),
    'nat_distribution', (SELECT coalesce(json_agg(row_to_json(n)), '[]'::json) FROM (SELECT coalesce(nationality, 'غير محدد') as name, count(*) as value FROM employees GROUP BY nationality ORDER BY count(*) DESC) n),
    'monthly_cards', (SELECT coalesce(json_agg(row_to_json(m) ORDER BY m.month), '[]'::json) FROM (
      SELECT to_char(created_at, 'YYYY-MM') as month, 
             count(*) as value 
      FROM employee_cards 
      WHERE created_at >= (CURRENT_DATE - interval '6 months')
      GROUP BY to_char(created_at, 'YYYY-MM')
    ) m),
    'status_distribution', (SELECT coalesce(json_agg(row_to_json(s)), '[]'::json) FROM (
      SELECT status::text as name, count(*) as value FROM employees GROUP BY status
    ) s)
  );
$$;
