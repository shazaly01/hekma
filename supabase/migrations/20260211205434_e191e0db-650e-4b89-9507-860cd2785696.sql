
-- Card types (أنواع البطاقات)
CREATE TABLE public.card_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.card_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view card_types" ON public.card_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert card_types" ON public.card_types FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update card_types" ON public.card_types FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete card_types" ON public.card_types FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Destruction reasons (أسباب الإتلاف)
CREATE TABLE public.destruction_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.destruction_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view destruction_reasons" ON public.destruction_reasons FOR SELECT USING (true);
CREATE POLICY "Admins can insert destruction_reasons" ON public.destruction_reasons FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update destruction_reasons" ON public.destruction_reasons FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete destruction_reasons" ON public.destruction_reasons FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Card issue status enum
CREATE TYPE public.card_issue_type AS ENUM ('new', 'renewal', 'replacement');

-- Employee cards (بطاقات الموظفين)
CREATE TABLE public.employee_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  card_type_id UUID NOT NULL REFERENCES public.card_types(id),
  issue_type card_issue_type NOT NULL DEFAULT 'new',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  reason TEXT, -- سبب الإصدار: انتهاء صلاحية، ضياع، إتلاف
  old_card_returned BOOLEAN DEFAULT false,
  non_return_reason TEXT, -- سبب عدم الاستلام
  is_destroyed BOOLEAN DEFAULT false,
  destruction_reason_id UUID REFERENCES public.destruction_reasons(id),
  destruction_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view employee_cards" ON public.employee_cards FOR SELECT USING (true);
CREATE POLICY "Admin/data_entry can insert employee_cards" ON public.employee_cards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'data_entry'::app_role));
CREATE POLICY "Admin/data_entry can update employee_cards" ON public.employee_cards FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'data_entry'::app_role));
CREATE POLICY "Admins can delete employee_cards" ON public.employee_cards FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
