-- Actualización de soporte y promoción por correo. Ejecuta TODO en Supabase → SQL Editor.
-- Es seguro ejecutarlo de nuevo: no borra pedidos, tickets ni sus números.
begin;
alter table public.portal_messages add column if not exists staff_name text not null default '';
alter table public.portal_messages add column if not exists staff_role text not null default '';
create or replace function public.portal_admin_action(p_reference text,p_version integer,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare entry public.portal_entries; previous_status text; event_body text; agent_name text; agent_role text;
begin
 agent_name:=coalesce(p_payload->>'staffName',''); agent_role:=coalesce(p_payload->>'staffRole','');
 if p_action in ('reply','update') and (char_length(trim(agent_name)) not between 2 and 80 or char_length(trim(agent_role)) not between 2 and 100) then raise exception 'staff_identity_required'; end if;
 select * into entry from public.portal_entries where reference=p_reference for update;
 if not found then return null; end if;
 if entry.version<>p_version then return jsonb_build_object('conflict',true); end if;
 if p_action='update' then
  previous_status:=entry.status;
  update public.portal_entries set status=p_payload->>'status',assignee=p_payload->>'assignee',due_date=nullif(p_payload->>'dueDate','')::date,version=version+1,updated_at=now() where reference=p_reference returning * into entry;
  event_body:=coalesce(nullif(p_payload->>'message',''),'El equipo actualizó el estado de tu solicitud.');
  if previous_status<>entry.status or coalesce(p_payload->>'message','')<>'' then
   insert into public.portal_messages(entry_reference,author,visibility,body,status,staff_name,staff_role) values(p_reference,'staff','public',event_body,entry.status,agent_name,agent_role);
  end if;
  insert into public.portal_messages(entry_reference,author,visibility,body) values(p_reference,'system','internal','Ficha actualizada desde administración. Estado: '||entry.status||'. Responsable: '||entry.assignee||'. Fecha objetivo: '||coalesce(entry.due_date::text,'sin definir')||'.');
 elsif p_action in ('reply','note') then
  insert into public.portal_messages(entry_reference,author,visibility,body,staff_name,staff_role) values(p_reference,'staff',case when p_action='note' then 'internal' else 'public' end,p_payload->>'message',agent_name,agent_role);
  update public.portal_entries set version=version+1,updated_at=now() where reference=p_reference returning * into entry;
 else raise exception 'invalid_action'; end if;
 return to_jsonb(entry);
end $$;


create table if not exists public.promotion_subscribers (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check (email=lower(trim(email)) and char_length(email) between 3 and 254),
 code text not null unique check (code ~ '^JC-[A-F0-9]{12}$'),
 percent integer not null check(percent between 1 and 15),
 active boolean not null default true,
 consent_at timestamptz not null default now(),
 consent_version text not null default 'coupon-email-v1',
 marketing_opt_in boolean not null default false,
 mail_status text not null default 'pending' check(mail_status in ('pending','sent','failed')),
 last_attempt_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.promotion_subscribers enable row level security;
revoke all on public.promotion_subscribers from public,anon,authenticated;
grant all on public.promotion_subscribers to service_role;

create or replace function public.promotion_register(p_email text,p_code text,p_percent integer,p_marketing boolean,p_nonce text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare contact public.promotion_subscribers;
begin
 if char_length(p_email)>254 or p_email<>lower(trim(p_email)) then raise exception 'invalid_email'; end if;
 -- Nonce is claimed persistently, including across different Vercel workers.
 insert into public.portal_rate_limits(key,hits,expires_at) values('promotion-nonce:'||p_nonce,1,now()+interval '15 minutes') on conflict(key) do nothing;
 if not found then return jsonb_build_object('send',false); end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('jeycee-coupon:'||p_email,0));
 select * into contact from public.promotion_subscribers where email=p_email for update;
 if found then
  if not contact.active or contact.last_attempt_at>now()-interval '5 minutes' then return jsonb_build_object('send',false); end if;
  -- Registration never redraws an existing discount or changes previous marketing consent.
  update public.promotion_subscribers set last_attempt_at=now() where id=contact.id returning * into contact;
 else
  insert into public.promotion_subscribers(email,code,percent,marketing_opt_in) values(p_email,p_code,p_percent,coalesce(p_marketing,false)) returning * into contact;
 end if;
 return jsonb_build_object('send',true,'subscriber',to_jsonb(contact));
end $$;
revoke all on function public.promotion_register(text,text,integer,boolean,text) from public,anon,authenticated;
grant execute on function public.promotion_register(text,text,integer,boolean,text) to service_role;
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
