
-- Grant execute permission on the public employee function to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_employee(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_employee(uuid) TO authenticated;
