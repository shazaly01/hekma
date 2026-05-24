CREATE POLICY "Admins can delete employee photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-photos' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);