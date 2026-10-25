-- Ejecuta todo este archivo en el SQL Editor de Supabase antes de habilitar PORTAL_ENABLED.
begin;
create table if not exists public.portal_entries (
 reference text primary key check (reference ~ '^JC-([0-9]{8}-)?([A-F0-9]{8}|[A-F0-9]{24})$'),
 kind text not null check (kind in ('order','ticket')),
 name text not null, email text not null default '', phone text not null default '', company text not null default '',
 service text not null, product_key text not null default '', plan text not null default '',
 price numeric(12,2), coupon text not null default '', content text not null,
 topic text not null, recipient text not null, project_ref text not null default '',
 status text not null default 'received' check (status in ('received','confirmed','in_progress','waiting_client','in_review','completed','cancelled')),
 assignee text not null default '', due_date date,
 tracking_hash text check (tracking_hash ~ '^[a-f0-9]{64}$'),
 submission_key uuid not null unique, submission_fingerprint text not null, challenge_nonce text not null unique,
 mail_status text not null default 'pending' check (mail_status in ('pending','sent','failed')),
 version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists portal_entries_updated on public.portal_entries(updated_at desc);
create table if not exists public.portal_messages (
 id uuid primary key default gen_random_uuid(), entry_reference text not null references public.portal_entries(reference) on delete cascade,
 author text not null check (author in ('staff','client','system')),
 visibility text not null check (visibility in ('public','internal')),
 body text not null check (char_length(body) between 1 and 3000), status text,
 client_message_id uuid, created_at timestamptz not null default now(), unique(entry_reference,client_message_id)
);
create index if not exists portal_messages_entry on public.portal_messages(entry_reference,created_at);
create table if not exists public.portal_rate_limits (key text primary key, hits integer not null, expires_at timestamptz not null);
alter table public.portal_entries enable row level security;
alter table public.portal_messages enable row level security;
alter table public.portal_rate_limits enable row level security;
revoke all on public.portal_entries,public.portal_messages,public.portal_rate_limits from anon,authenticated;
grant all on public.portal_entries,public.portal_messages,public.portal_rate_limits to service_role;

create or replace function public.portal_allow_request(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare current_hits integer;
begin
 if p_limit<1 or p_limit>1000 or p_seconds<1 or p_seconds>86400 then return false; end if;
 delete from public.portal_rate_limits where expires_at<now();
 insert into public.portal_rate_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set hits=public.portal_rate_limits.hits+1 returning hits into current_hits;
 return current_hits<=p_limit;
end $$;

create or replace function public.portal_create_entry(p_entry jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare entry public.portal_entries; inserted boolean:=false;
begin
 insert into public.portal_entries(reference,kind,name,email,phone,company,service,product_key,plan,price,coupon,content,topic,recipient,project_ref,tracking_hash,submission_key,submission_fingerprint,challenge_nonce)
 values(p_entry->>'reference',p_entry->>'kind',p_entry->>'name',coalesce(p_entry->>'email',''),coalesce(p_entry->>'phone',''),coalesce(p_entry->>'company',''),p_entry->>'service',coalesce(p_entry->>'product_key',''),coalesce(p_entry->>'plan',''),(p_entry->>'price')::numeric,coalesce(p_entry->>'coupon',''),p_entry->>'content',p_entry->>'topic',p_entry->>'recipient',coalesce(p_entry->>'project_ref',''),p_entry->>'tracking_hash',(p_entry->>'submission_key')::uuid,p_entry->>'submission_fingerprint',p_entry->>'challenge_nonce')
 on conflict(submission_key) do nothing returning * into entry;
 if found then
  inserted:=true;
  insert into public.portal_messages(entry_reference,author,visibility,body,status) values(entry.reference,'system','public','Solicitud recibida. El equipo revisará el alcance y los próximos pasos.','received');
 else
  select * into entry from public.portal_entries where submission_key=(p_entry->>'submission_key')::uuid;
  if entry.submission_fingerprint<>p_entry->>'submission_fingerprint' or entry.kind<>p_entry->>'kind' then return jsonb_build_object('conflict',true); end if;
 end if;
 return jsonb_build_object('entry',to_jsonb(entry),'inserted',inserted);
end $$;

create or replace function public.portal_admin_action(p_reference text,p_version integer,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare entry public.portal_entries; previous_status text; event_body text;
begin
 select * into entry from public.portal_entries where reference=p_reference for update;
 if not found then return null; end if;
 if entry.version<>p_version then return jsonb_build_object('conflict',true); end if;
 if p_action='update' then
  previous_status:=entry.status;
  update public.portal_entries set status=p_payload->>'status',assignee=p_payload->>'assignee',due_date=nullif(p_payload->>'dueDate','')::date,version=version+1,updated_at=now() where reference=p_reference returning * into entry;
  event_body:=coalesce(nullif(p_payload->>'message',''),'El equipo actualizó el estado de tu solicitud.');
  if previous_status<>entry.status or coalesce(p_payload->>'message','')<>'' then
   insert into public.portal_messages(entry_reference,author,visibility,body,status) values(p_reference,'system','public',event_body,entry.status);
  end if;
  insert into public.portal_messages(entry_reference,author,visibility,body) values(p_reference,'system','internal','Ficha actualizada desde administración. Estado: '||entry.status||'. Responsable: '||entry.assignee||'. Fecha objetivo: '||coalesce(entry.due_date::text,'sin definir')||'.');
 elsif p_action in ('reply','note') then
  insert into public.portal_messages(entry_reference,author,visibility,body) values(p_reference,'staff',case when p_action='note' then 'internal' else 'public' end,p_payload->>'message');
  update public.portal_entries set version=version+1,updated_at=now() where reference=p_reference returning * into entry;
 else raise exception 'invalid_action'; end if;
 return to_jsonb(entry);
end $$;

create or replace function public.portal_client_message(p_reference text,p_body text,p_message_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 insert into public.portal_messages(entry_reference,author,visibility,body,client_message_id) values(p_reference,'client','public',p_body,p_message_id) on conflict(entry_reference,client_message_id) do nothing;
 if found then update public.portal_entries set version=version+1,updated_at=now() where reference=p_reference; end if;
 return true;
end $$;

create or replace function public.portal_stats() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('orders',count(*) filter(where kind='order'),'tickets',count(*) filter(where kind='ticket'),'active',count(*) filter(where status not in ('completed','cancelled')),'waiting',count(*) filter(where status='waiting_client')) from public.portal_entries;
$$;

revoke all on function public.portal_allow_request(text,integer,integer),public.portal_create_entry(jsonb),public.portal_admin_action(text,integer,text,jsonb),public.portal_client_message(text,text,uuid),public.portal_stats() from public,anon,authenticated;
grant execute on function public.portal_allow_request(text,integer,integer),public.portal_create_entry(jsonb),public.portal_admin_action(text,integer,text,jsonb),public.portal_client_message(text,text,uuid),public.portal_stats() to service_role;

-- Numeración secuencial de nuevas solicitudes.
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
notify pgrst,'reload schema';

commit;
