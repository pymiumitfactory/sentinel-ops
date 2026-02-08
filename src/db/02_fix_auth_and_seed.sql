-- FIX: Remove blocking trigger and Seed Initial Data
-- Run this in Supabase SQL Editor if "Database error creating new user" persists.

-- 1. DROP THE BLOCKING TRIGGER (Allow manual user creation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREATE A DEFAULT ORGANIZATION (If none exists)
-- We use a fixed UUID for the default org to make manual inserts easier
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Sentinel Default Corp')
ON CONFLICT (id) DO NOTHING;

-- 3. INSTRUCTIONS FOR LINKING YOUR NEW USER:
-- After creating your user in Authentication > Users, copy the User UID.
-- Then run this snippet in SQL Editor (replace THE_USER_UID):

/*
INSERT INTO public.profiles (id, org_id, full_name, role)
VALUES (
    'PEGA_AQUI_TU_USER_UID', 
    '00000000-0000-0000-0000-000000000000', 
    'Admin User', 
    'admin'
) ON CONFLICT DO NOTHING;
*/

-- 4. OPTIONAL: Better Trigger (Non-blocking)
-- Only runs if metadata is present, otherwise fails silently/logs but allows user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_safe() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only attempt profile creation if org_id is provided in metadata
  IF (new.raw_user_meta_data->>'org_id') IS NOT NULL THEN
      INSERT INTO public.profiles (id, org_id, full_name)
      VALUES (
          new.id, 
          (new.raw_user_meta_data->>'org_id')::uuid, 
          new.raw_user_meta_data->>'full_name'
      );
  END IF;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but DO NOT BLOCK execution
  RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_safe
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_safe();
