-- Migration: Enable Team Visibility
-- Description: Update RLS policies to allow users to see their team members

-- 1. DROP old restrictive policy (User can only see themselves)
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;

-- 2. CREATE new Team policy
-- "I can see anyone who belongs to the same organization as me"
CREATE POLICY "Team Visibility" ON public.profiles
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- 3. Policy for ADMINS to Update Roles (Optional for MVP, good to have)
-- "Only Admins can update profiles in their org"
CREATE POLICY "Admin Update Profiles" ON public.profiles
    FOR UPDATE
    USING (
        org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
