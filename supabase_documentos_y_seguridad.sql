-- Salud 360: formularios/encuestas y plan de seguridad
-- Ejecutar en Supabase SQL Editor.

-- FASE 1: tabla para guardar formularios, encuestas y borradores.
create table if not exists public.documentos (
    id text primary key,
    paciente_id uuid not null references public.pacientes(id) on delete cascade,
    test_id text,
    titulo text not null default '',
    contenido text not null default '',
    raw_data jsonb not null default '{}'::jsonb,
    fecha text,
    fecha_guardado text,
    profesional text,
    estado text not null default 'finalizado',
    editable boolean not null default false,
    is_test boolean not null default true,
    firma text,
    firma_nombre text,
    firma_rut text,
    firma_relacion text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_documentos_paciente_id
    on public.documentos(paciente_id);

create index if not exists idx_documentos_estado
    on public.documentos(estado);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_documentos_updated_at on public.documentos;
create trigger trg_documentos_updated_at
before update on public.documentos
for each row
execute function public.set_updated_at();

-- Si tu proyecto aun no usa Supabase Auth, deja RLS desactivado para esta tabla
-- hasta crear usuarios reales. La app mantendra respaldo local si Supabase rechaza
-- el guardado, pero no podra sincronizar documentos con RLS sin sesion.
alter table public.documentos disable row level security;

-- FASE 2: seguridad real con Supabase Auth.
-- Antes de activar esto:
-- 1. Crea usuarios en Authentication > Users.
-- 2. Usa emails internos como admi@salud360.local, acontreras@salud360.local, etc.
-- 3. Asigna las mismas contrasenas o unas nuevas seguras.
-- 4. Prueba iniciar sesion desde la web.
--
-- Luego puedes ejecutar estas reglas. Ojo: al activar RLS, el acceso antiguo
-- con usuarios hardcodeados deja de poder leer/escribir datos en Supabase.

-- alter table public.pacientes enable row level security;
-- alter table public.visitas enable row level security;
-- alter table public.entregas enable row level security;
-- alter table public.documentos enable row level security;

-- drop policy if exists "Usuarios autenticados leen pacientes" on public.pacientes;
-- create policy "Usuarios autenticados leen pacientes"
-- on public.pacientes for select
-- to authenticated
-- using (true);

-- drop policy if exists "Usuarios autenticados escriben pacientes" on public.pacientes;
-- create policy "Usuarios autenticados escriben pacientes"
-- on public.pacientes for all
-- to authenticated
-- using (true)
-- with check (true);

-- drop policy if exists "Usuarios autenticados leen visitas" on public.visitas;
-- create policy "Usuarios autenticados leen visitas"
-- on public.visitas for select
-- to authenticated
-- using (true);

-- drop policy if exists "Usuarios autenticados escriben visitas" on public.visitas;
-- create policy "Usuarios autenticados escriben visitas"
-- on public.visitas for all
-- to authenticated
-- using (true)
-- with check (true);

-- drop policy if exists "Usuarios autenticados leen entregas" on public.entregas;
-- create policy "Usuarios autenticados leen entregas"
-- on public.entregas for select
-- to authenticated
-- using (true);

-- drop policy if exists "Usuarios autenticados escriben entregas" on public.entregas;
-- create policy "Usuarios autenticados escriben entregas"
-- on public.entregas for all
-- to authenticated
-- using (true)
-- with check (true);

-- drop policy if exists "Usuarios autenticados leen documentos" on public.documentos;
-- create policy "Usuarios autenticados leen documentos"
-- on public.documentos for select
-- to authenticated
-- using (true);

-- drop policy if exists "Usuarios autenticados escriben documentos" on public.documentos;
-- create policy "Usuarios autenticados escriben documentos"
-- on public.documentos for all
-- to authenticated
-- using (true)
-- with check (true);
