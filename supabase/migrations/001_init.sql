-- ============================================================
-- Budgetly — схема БД для автопланирования бюджета и контроля
-- Применить в Supabase: SQL Editor → New query → вставить → Run
-- ============================================================

-- Чистая переустановка (для повторного прогона миграции на демо-проекте)
drop view   if exists request_totals            cascade;
drop table  if exists notifications             cascade;
drop table  if exists budget_items              cascade;
drop table  if exists budget_requests           cascade;
drop table  if exists departments               cascade;
drop table  if exists budget_periods            cascade;
drop table  if exists members                   cascade;
drop table  if exists companies                 cascade;

-- ------------------------------------------------------------
-- Компании. access_code — «ключ» компании, по нему входят все.
-- ------------------------------------------------------------
create table companies (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  access_code  text        not null unique,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Участники: экономист или руководитель департамента.
-- pin — упрощённая авторизация для демо (сессия в localStorage).
-- ------------------------------------------------------------
create table members (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  role         text not null check (role in ('economist','department_head')),
  full_name    text not null,
  pin          text not null,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Периоды бюджета: экономист задаёт общий бюджет на период.
-- ------------------------------------------------------------
create table budget_periods (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  title               text not null,
  date_from           date not null,
  date_to             date not null,
  total_budget        numeric(16,2) not null check (total_budget >= 0),
  planned_departments int not null default 0 check (planned_departments >= 0),
  created_at          timestamptz not null default now(),
  check (date_to >= date_from)
);

-- ------------------------------------------------------------
-- Департаменты. auto_limit — автоматически распределённый лимит.
-- Имя уникально в пределах компании.
-- ------------------------------------------------------------
create table departments (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  name           text not null,
  head_member_id uuid references members(id) on delete set null,
  auto_limit     numeric(16,2) not null default 0 check (auto_limit >= 0),
  created_at     timestamptz not null default now(),
  unique (company_id, name)
);

-- ------------------------------------------------------------
-- Заявки на бюджет. Статусная машина: draft → submitted →
-- approved | revision → (снова submitted). Один активный
-- запрос на пару (департамент, период).
-- ------------------------------------------------------------
create table budget_requests (
  id                uuid primary key default gen_random_uuid(),
  department_id     uuid not null references departments(id)    on delete cascade,
  period_id         uuid not null references budget_periods(id) on delete cascade,
  status            text not null default 'draft'
                    check (status in ('draft','submitted','approved','revision')),
  economist_comment text,
  submitted_at      timestamptz,
  decided_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (department_id, period_id)
);

-- ------------------------------------------------------------
-- Позиции заявки. line_total = quantity × unit_cost (считает БД).
-- ------------------------------------------------------------
create table budget_items (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references budget_requests(id) on delete cascade,
  name          text not null,
  category      text not null default 'Прочее',
  quantity      numeric(12,2) not null default 1 check (quantity >= 0),
  unit_cost     numeric(16,2) not null default 0 check (unit_cost >= 0),
  justification text not null default '',
  line_total    numeric(16,2) generated always as (quantity * unit_cost) stored,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Уведомления. recipient_member_id = null → всем в компании.
-- ------------------------------------------------------------
create table notifications (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  recipient_member_id uuid references members(id) on delete cascade,
  kind                text not null,
  title               text not null,
  body                text not null default '',
  payload             jsonb not null default '{}'::jsonb,
  read                boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- View итогов по заявке: сумма позиций + сравнение с лимитом.
-- Фронт только отображает — цифры считает БД, не разъезжаются.
-- ------------------------------------------------------------
create view request_totals as
select
  r.id                                   as request_id,
  r.department_id,
  r.period_id,
  r.status,
  d.name                                 as department_name,
  d.auto_limit,
  coalesce(sum(i.line_total), 0)         as requested_total,
  count(i.id)                            as item_count,
  d.auto_limit - coalesce(sum(i.line_total), 0) as remaining,
  case when d.auto_limit > 0
       then round(coalesce(sum(i.line_total),0) / d.auto_limit * 100, 1)
       else 0 end                        as utilization_pct,
  (coalesce(sum(i.line_total),0) > d.auto_limit) as over_limit
from budget_requests r
join departments d       on d.id = r.department_id
left join budget_items i on i.request_id = r.id
group by r.id, r.department_id, r.period_id, r.status, d.name, d.auto_limit;

-- ------------------------------------------------------------
-- Триггер статусной машины: разрешаем только валидные переходы.
-- ------------------------------------------------------------
create or replace function enforce_request_status() returns trigger as $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- матрица допустимых переходов
  if not (
       (old.status = 'draft'     and new.status = 'submitted')
    or (old.status = 'submitted' and new.status in ('approved','revision'))
    or (old.status = 'revision'  and new.status = 'submitted')
    or (old.status = 'approved'  and new.status = 'revision')  -- переоткрытие
  ) then
    raise exception 'Недопустимый переход статуса заявки: % → %', old.status, new.status;
  end if;

  if new.status = 'submitted' then
    new.submitted_at := now();
  elsif new.status in ('approved','revision') then
    new.decided_at := now();
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_request_status on budget_requests;
create trigger trg_request_status
  before update of status on budget_requests
  for each row execute function enforce_request_status();

-- ------------------------------------------------------------
-- RLS: демо-режим. Приложение работает через anon-ключ и само
-- разделяет данные по company_id. Для хакатона политики открытые;
-- в проде их нужно ужесточить (см. README).
-- ------------------------------------------------------------
alter table companies       enable row level security;
alter table members         enable row level security;
alter table budget_periods  enable row level security;
alter table departments     enable row level security;
alter table budget_requests enable row level security;
alter table budget_items    enable row level security;
alter table notifications   enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'companies','members','budget_periods','departments',
    'budget_requests','budget_items','notifications'
  ] loop
    execute format('drop policy if exists demo_all on %I;', t);
    execute format('create policy demo_all on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Realtime: экономист и департаменты видят изменения мгновенно.
-- ------------------------------------------------------------
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table budget_requests;
alter publication supabase_realtime add table departments;

-- Индексы под частые выборки
create index on members         (company_id);
create index on departments     (company_id);
create index on budget_periods  (company_id);
create index on budget_requests (period_id);
create index on budget_requests (department_id);
create index on budget_items    (request_id);
create index on notifications   (company_id, recipient_member_id, read);
