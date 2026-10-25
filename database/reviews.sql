-- Ejecutar en un proyecto Supabase controlado por la agencia.
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),
 author text not null check (char_length(author) between 1 and 70),
 rating integer not null check (rating between 1 and 5),
 text text not null check (char_length(text) between 10 and 1500),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
-- Sin políticas públicas: solo la función del servidor usa service_role.
-- Modera desde el panel: aprueba experiencias reales sin filtrar por valoración.
-- Antes de abrir a gran tráfico, habilita protección de abuso/rate limiting en Vercel.
