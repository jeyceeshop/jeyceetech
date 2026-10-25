-- Si ya ejecutaste portal.sql, aplica esta actualización en Supabase SQL Editor.
-- Conserva registros y conversaciones existentes. No requiere credenciales nuevas.
begin;
alter table public.portal_entries drop constraint if exists portal_entries_reference_check;
alter table public.portal_entries add constraint portal_entries_reference_check check (reference ~ '^JC-([0-9]{8}-)?([A-F0-9]{8}|[A-F0-9]{24})$');
-- Columna heredada conservada para compatibilidad con la función de inserción existente.
-- Las nuevas solicitudes no generan ni utilizan una clave adicional.
alter table public.portal_entries alter column tracking_hash drop not null;
commit;
