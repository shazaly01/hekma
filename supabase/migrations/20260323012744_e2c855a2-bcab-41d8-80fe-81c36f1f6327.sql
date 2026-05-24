
-- Fix get_qr_pin_status function - proper JSONB boolean casting
CREATE OR REPLACE FUNCTION public.get_qr_pin_status(emp_id UUID)
RETURNS TABLE(pin_required BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_global_enabled BOOLEAN;
  v_card_type_pin_enabled BOOLEAN;
BEGIN
  -- Check global PIN (JSONB -> text -> boolean)
  SELECT (value #>> '{}')::boolean INTO v_global_enabled
  FROM app_settings WHERE key = 'global_pin_enabled';

  IF v_global_enabled IS TRUE THEN
    RETURN QUERY SELECT true;
    RETURN;
  END IF;

  -- Check card-type PIN
  SELECT ct.pin_enabled INTO v_card_type_pin_enabled
  FROM employee_cards ec
  JOIN card_types ct ON ct.id = ec.card_type_id
  WHERE ec.employee_id = emp_id
    AND (ec.is_destroyed IS NULL OR ec.is_destroyed = false)
  ORDER BY ec.created_at DESC
  LIMIT 1;

  IF v_card_type_pin_enabled IS TRUE THEN
    RETURN QUERY SELECT true;
    RETURN;
  END IF;

  RETURN QUERY SELECT false;
END;
$$;

-- Fix verify_qr_pin function - proper JSONB boolean casting
CREATE OR REPLACE FUNCTION public.verify_qr_pin(emp_id UUID, input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_global_enabled BOOLEAN;
  v_global_pin TEXT;
  v_card_type_pin TEXT;
  v_card_type_pin_enabled BOOLEAN;
BEGIN
  -- Check global PIN first (JSONB -> text -> boolean)
  SELECT (value #>> '{}')::boolean INTO v_global_enabled
  FROM app_settings WHERE key = 'global_pin_enabled';

  IF v_global_enabled IS TRUE THEN
    SELECT value #>> '{}' INTO v_global_pin
    FROM app_settings WHERE key = 'global_pin_code';
    RETURN input_pin = v_global_pin;
  END IF;

  -- Check card-type PIN
  SELECT ct.pin_enabled, ct.pin_code INTO v_card_type_pin_enabled, v_card_type_pin
  FROM employee_cards ec
  JOIN card_types ct ON ct.id = ec.card_type_id
  WHERE ec.employee_id = emp_id
    AND (ec.is_destroyed IS NULL OR ec.is_destroyed = false)
  ORDER BY ec.created_at DESC
  LIMIT 1;

  IF v_card_type_pin_enabled IS TRUE THEN
    RETURN input_pin = v_card_type_pin;
  END IF;

  -- No PIN required
  RETURN true;
END;
$$;
