-- Seed Data for Users and Assets

-- 1. Create Organization (if not exists)
DO $$
DECLARE
    new_org_id uuid;
    admin_id uuid;
BEGIN
    -- Check if org exists, create if not
    SELECT id INTO new_org_id FROM organizations WHERE name = 'Minera Las Bambas Demo';
    IF new_org_id IS NULL THEN
        INSERT INTO organizations (name, tax_id, industry)
        VALUES ('Minera Las Bambas Demo', '20555555551', 'mining')
        RETURNING id INTO new_org_id;
    END IF;

    -- Note: Users (profiles) are tied to Auth UID, so we can't seed them directly via SQL easily without auth users existing.
    -- We'll just seed assets linked to this Org.

    -- 2. Seed Assets
    -- Clear existing assets to avoid dupes on re-run
    DELETE FROM assets WHERE org_id = new_org_id;

    INSERT INTO assets (org_id, name, internal_id, category, brand, model, current_hours, status, location)
    VALUES
    (new_org_id, 'Excavadora Cat 395', 'MIN-EXC-001', 'heavy_machinery', 'Caterpillar', '395 Next Gen', 1250, 'active', 'Tajo Abierto - Zona Norte'),
    (new_org_id, 'Perforadora Sandvik DR410i', 'MIN-PERF-002', 'heavy_machinery', 'Sandvik', 'DR410i', 3400, 'warning', 'Nivel 4500 - Sector B'),
    (new_org_id, 'Tractor John Deere 8R', 'AGRO-TRAC-045', 'heavy_machinery', 'John Deere', '8R 410', 890, 'down', 'Fundo La Joya - Lote 12'), -- Not strictly mining, but for demo
    (new_org_id, 'Pivote Central Riego', 'AGRO-RIE-008', 'irrigation_system', 'Valley', '8000 Series', 15600, 'active', 'Fundo Majes - Sección C');

    -- 3. Seed Alerts
    -- We need the asset IDs to link alerts, let's grab them
    -- (This is simplified for demo purposes)
    INSERT INTO alerts (asset_id, severity, description, is_resolved)
    SELECT id, 'medium', 'Vibración inusual detectada en cabezal de perforación. Posible desgaste de rodamiento.', false
    FROM assets WHERE internal_id = 'MIN-PERF-002';

    INSERT INTO alerts (asset_id, severity, description, is_resolved)
    SELECT id, 'high', 'Sobrecalentamiento crítico de motor. Parada de emergencia ejecutada.', false
    FROM assets WHERE internal_id = 'AGRO-TRAC-045';

    RAISE NOTICE 'Seed completed for Organization ID: %', new_org_id;
END $$;
