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

commit;
