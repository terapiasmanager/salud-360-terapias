-- Salud 360: firma profesional obligatoria en actas de visita.
-- Ejecutar en Supabase SQL Editor antes de guardar nuevas visitas.

alter table public.visitas
add column if not exists firma_profesional_base64 text;

notify pgrst, 'reload schema';
