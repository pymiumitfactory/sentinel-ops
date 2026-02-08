-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. Create Enums (for strict typing)
create type public.industry_type as enum ('mining', 'agriculture', 'construction');
create type public.user_role as enum ('admin', 'supervisor', 'operator');
create type public.asset_category as enum ('heavy_machinery', 'irrigation_system', 'transport', 'utility');
create type public.asset_status as enum ('active', 'warning', 'down', 'maintenance');
create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');

-- 2. Organizations Table (Tenancy Root)
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  tax_id text, -- RUC for Peru
  industry public.industry_type not null default 'mining',
  created_at timestamptz default now()
);

-- 3. Profiles (Extension of auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  full_name text,
  role public.user_role not null default 'operator',
  phone text,
  updated_at timestamptz
);

-- 4. Assets (The core entity)
create table public.assets (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  internal_id text not null, -- Plate or internal code (e.g. MIN-001)
  category public.asset_category not null default 'heavy_machinery',
  brand text,
  model text,
  current_hours numeric default 0,
  status public.asset_status not null default 'active',
  last_service_date date,
  location text, -- Human readable location
  created_at timestamptz default now()
);

-- 5. Daily Logs (Checklists)
create table public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  operator_id uuid references public.profiles(id), -- Nullable if operator deleted
  hours_reading numeric not null,
  answers jsonb not null default '[]'::jsonb, -- Flexible checklist answers
  photo_url text,
  gps_lat numeric,
  gps_lng numeric,
  created_at timestamptz default now()
);

-- 6. Alerts (Generated from bad logs)
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  severity public.alert_severity not null default 'medium',
  description text not null,
  is_resolved boolean default false,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- row level security (rls)
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.daily_logs enable row level security;
alter table public.alerts enable row level security;

-- Policies (Simplified for MVP: "If you are in the Org, you see the Org's data")

-- Helper function to get current user's org_id
create or replace function get_auth_org_id()
returns uuid as $$
  select org_id from public.profiles where id = auth.uid()
$$ language sql security definer;

-- Organizations: Users can view their own org
create policy "Users can view own organization" on public.organizations
  for select using (id = get_auth_org_id());

-- Profiles: Users can view profiles in same org
create policy "Users can view members of own org" on public.profiles
  for select using (org_id = get_auth_org_id());

-- Assets: View and Edit within same org
create policy "View assets in own org" on public.assets
  for select using (org_id = get_auth_org_id());
create policy "Edit assets in own org" on public.assets
  for update using (org_id = get_auth_org_id());

-- Logs: View all in org, Insert own
create policy "View logs in own org" on public.daily_logs
  for select using (
    asset_id in (select id from public.assets where org_id = get_auth_org_id())
  );
create policy "Insert logs for assets in own org" on public.daily_logs
  for insert with check (
    asset_id in (select id from public.assets where org_id = get_auth_org_id())
  );

-- Alerts: View and Manage in own org
create policy "View alerts in own org" on public.alerts
  for select using (
    asset_id in (select id from public.assets where org_id = get_auth_org_id())
  );
create policy "Manage alerts in own org" on public.alerts
  for update using (
    asset_id in (select id from public.assets where org_id = get_auth_org_id())
  );
