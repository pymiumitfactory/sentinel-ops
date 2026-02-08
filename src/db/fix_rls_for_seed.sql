-- MVP Quick Fix: Allow public access to Seed Data
-- CAUTION: This removes security checks. Only for initial MVP Demo.

-- 1. Organizations
drop policy if exists "Users can view own organization" on organizations;
create policy "Allow Public Access Organizations" on organizations for all using (true);

-- 2. Assets
drop policy if exists "View assets in own org" on assets;
drop policy if exists "Edit assets in own org" on assets;
create policy "Allow Public Access Assets" on assets for all using (true);

-- 3. Alerts
drop policy if exists "View alerts in own org" on alerts;
drop policy if exists "Manage alerts in own org" on alerts;
create policy "Allow Public Access Alerts" on alerts for all using (true);

-- 4. Daily Logs
drop policy if exists "View logs in own org" on daily_logs;
drop policy if exists "Insert logs for assets in own org" on daily_logs;
create policy "Allow Public Access Logs" on daily_logs for all using (true);
