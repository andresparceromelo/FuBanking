-- Corregir la foreign key de loan_applications para apuntar a public.users (no auth.users)

-- 1. Eliminar la constraint incorrecta si existe
ALTER TABLE public.loan_applications
  DROP CONSTRAINT IF EXISTS loan_applications_user_id_fkey;

-- 2. Crear la constraint correcta apuntando a public.users
ALTER TABLE public.loan_applications
  ADD CONSTRAINT loan_applications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
