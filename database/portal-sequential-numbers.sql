-- Ejecuta una sola vez en Supabase → SQL Editor → Run.
-- Conserva todos los pedidos existentes. Repetir el archivo no reinicia el contador.
begin;
create sequence if not exists public.portal_reference_seq
 as bigint minvalue 1 maxvalue 99999999 start with 1 no cycle;

create or replace function public.portal_create_numbered_entry(p_entry jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing public.portal_entries; code text; violated_constraint text;
begin
 -- A retry of the same submission must return its original number, even concurrently.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('jeycee-submission:'||(p_entry->>'submission_key'),0));
 select * into existing from public.portal_entries where submission_key=(p_entry->>'submission_key')::uuid;
 if found then
  if existing.submission_fingerprint<>p_entry->>'submission_fingerprint' or existing.kind<>p_entry->>'kind' then
   return jsonb_build_object('conflict',true);
  end if;
  return jsonb_build_object('entry',to_jsonb(existing),'inserted',false);
 end if;
 loop
  -- The padded internal value remains compatible with existing table constraints.
  -- The website, emails and WhatsApp display JC-0001, JC-0002, etc.
  code:='JC-'||pg_catalog.lpad(pg_catalog.nextval('public.portal_reference_seq')::text,8,'0');
  begin
   return public.portal_create_entry(p_entry||jsonb_build_object(
    'reference',code,
    'tracking_hash',coalesce(nullif(p_entry->>'tracking_hash',''),pg_catalog.repeat('0',64))
   ));
  exception when unique_violation then
   get stacked diagnostics violated_constraint=constraint_name;
   -- Skip any pre-existing reference; never overwrite a previous order.
   if violated_constraint<>'portal_entries_pkey' then raise; end if;
  end;
 end loop;
end $$;

revoke all on function public.portal_create_numbered_entry(jsonb) from public,anon,authenticated;
grant execute on function public.portal_create_numbered_entry(jsonb) to service_role;
revoke all on sequence public.portal_reference_seq from public,anon,authenticated;
grant usage,select on sequence public.portal_reference_seq to service_role;
notify pgrst,'reload schema';
commit;
