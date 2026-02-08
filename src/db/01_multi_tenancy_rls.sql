-- Migration: Enable Strict Multi-tenancy via RLS
-- Description: Enforce data isolation based on Organization ID in Profiles

-- 1. Ensure Profiles table exists (Links Auth User to Organization)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id),
    role TEXT DEFAULT 'operator', -- options: 'admin', 'supervisor', 'operator'
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on Critical Tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 3. Define Access Policies (The "Firewall")

--  [PROFILES] Users can read their own profile
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
CREATE POLICY "Read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- [ORGANIZATIONS] Users can read their own organization
DROP POLICY IF EXISTS "Read own organization" ON public.organizations;
CREATE POLICY "Read own organization" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    );

-- [ASSETS] Visible only to users in the same organization
DROP POLICY IF EXISTS "Tenant Isolation: Assets" ON public.assets;
CREATE POLICY "Tenant Isolation: Assets" ON public.assets
    FOR ALL USING (
        org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    );

-- [LOGS] Visible only if the parent Asset belongs to user's organization
-- note: daily_logs does NOT need org_id column, we use the relation to assets
DROP POLICY IF EXISTS "Tenant Isolation: Logs Read" ON public.daily_logs;
CREATE POLICY "Tenant Isolation: Logs Read" ON public.daily_logs
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM public.assets 
            WHERE org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Tenant Isolation: Logs Insert" ON public.daily_logs;
CREATE POLICY "Tenant Isolation: Logs Insert" ON public.daily_logs
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM public.assets 
            WHERE org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- [ALERTS] Visible only if parent Asset belongs to org
DROP POLICY IF EXISTS "Tenant Isolation: Alerts" ON public.alerts;
CREATE POLICY "Tenant Isolation: Alerts" ON public.alerts
    FOR ALL USING (
        asset_id IN (
            SELECT id FROM public.assets 
            WHERE org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- 4. Auto-create Profile on Signup (Optional utility)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, org_id, full_name)
  VALUES (
      new.id, 
      (new.raw_user_meta_data->>'org_id')::uuid, 
      new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger only if not exists (idempotent logic omitted for brevity in raw sql)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
