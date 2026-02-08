-- Trigger function to update asset status based on log severity

-- 1. Create the Function first
create or replace function public.log_to_asset_semaphore()
returns trigger
AS $$
declare
    max_sev text;
    final_status public.asset_status;
begin
    -- 1. Determine highest severity in the JSON array (answers)
    -- JSON structure: [{ "questionId": "oil", "value": "LOW", "severity": "critical" }, ...]
    
    -- We can use a simpler approach for MVP: Check if string "critical" exists in JSON
    -- But let's try to be precise with jsonb_array_elements
    
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(NEW.answers) elem 
                WHERE (elem->>'severity') = 'critical'
            ) THEN 'critical'
            WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(NEW.answers) elem 
                WHERE (elem->>'severity') = 'warning'
            ) THEN 'warning'
            ELSE 'ok'
        END
    INTO max_sev;

    -- 2. React based on severity
    IF max_sev = 'critical' THEN
        final_status := 'down';

        -- Create Alert
        INSERT INTO public.alerts (asset_id, severity, description)
        VALUES (NEW.asset_id, 'high', 'Parada de emergencia reportada por operador (Log Auto).');

    ELSIF max_sev = 'warning' THEN
        final_status := 'warning';
        
        -- Create Alert
        INSERT INTO public.alerts (asset_id, severity, description)
        VALUES (NEW.asset_id, 'medium', 'Advertencia detectada en inspección diaria (Log Auto).');

    ELSE
        -- If inspection is clean, we set back to active
        final_status := 'active';
    END IF;

    -- 3. Update Asset 
    UPDATE public.assets
    SET 
        status = final_status,
        current_hours = NEW.hours_reading -- Also update hours automatically!
        -- location = NEW.gps_lat || ',' || NEW.gps_lng -- Could update location too if column type matched
    WHERE id = NEW.asset_id;

    RETURN NEW;
end;
$$ language plpgsql security definer;

-- 2. Attach Trigger to Table
drop trigger if exists on_daily_log_insert on public.daily_logs;

create trigger on_daily_log_insert
    after insert on public.daily_logs
    for each row
    execute function public.log_to_asset_semaphore();
