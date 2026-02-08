-- Fix recursive policy issue in "Team Visibility" or "Tenant Isolation"
-- The issue causes infinite recursion because the policy queries the same table it protects.

-- 1. Create a secure function to fetch the current user's Organization ID
-- This function is SECURITY DEFINER, meaning it bypasses RLS when running.
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Team Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Tenant Isolation: Assets" ON public.assets;
DROP POLICY IF EXISTS "Tenant Isolation: Logs Read" ON public.daily_logs;
DROP POLICY IF EXISTS "Tenant Isolation: Logs Insert" ON public.daily_logs;
DROP POLICY IF EXISTS "Tenant Isolation: Alerts" ON public.alerts;
DROP POLICY IF EXISTS "Read own organization" ON public.organizations;

-- 3. Re-create policies using the safe function or direct auth.uid() checks

-- [PROFILES]
CREATE POLICY "Team Visibility" ON public.profiles
    FOR SELECT
    USING (
        org_id = public.get_current_org_id()
    );

-- [ASSETS]
CREATE POLICY "Tenant Isolation: Assets" ON public.assets
    FOR ALL
    USING (
        org_id = public.get_current_org_id()
    );

-- [LOGS]
-- Optimization: Instead of querying assets table (which has RLS), we can trust the asset_id linkage if we enforce it at insert time.
-- But for reading, we must ensure the asset belongs to the same org.
-- Using the function here prevents complex nested recursion if assets table RLS was also recursive.
CREATE POLICY "Tenant Isolation: Logs Read" ON public.daily_logs
    FOR SELECT
    USING (
        asset_id IN (
            SELECT id FROM public.assets 
            WHERE org_id = public.get_current_org_id()
        )
    );

CREATE POLICY "Tenant Isolation: Logs Insert" ON public.daily_logs
    FOR INSERT
    WITH CHECK (
        asset_id IN (
            SELECT id FROM public.assets 
            WHERE org_id = public.get_current_org_id()
        )
    );

-- [ALERTS]
CREATE POLICY "Tenant Isolation: Alerts" ON public.alerts
    FOR ALL
    USING (
        asset_id IN (
            SELECT id FROM public.assets 
            WHERE org_id = public.get_current_org_id()
        )
    );

-- [ORGANIZATIONS]
CREATE POLICY "Read own organization" ON public.organizations
    FOR SELECT
    USING (
        id = public.get_current_org_id()
    );
