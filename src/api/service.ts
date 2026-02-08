import { supabase } from './supabaseClient';
import { db } from './offline_db';
import type { Asset, Alert, MaintenanceLog } from '../types';

// Interface
export interface SentinelDataService {
    getAssets(): Promise<Asset[]>;
    getAssetById(id: string): Promise<Asset | undefined>;
    getAlerts(): Promise<Alert[]>;
    submitLog(log: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog>;
    seedData(): Promise<void>;
    syncPendingLogs(): Promise<number>;
    getPendingLogsCount(): Promise<number>;
}

// Supabase Implementation
class SupabaseSentinelService implements SentinelDataService {

    async getAssets(): Promise<Asset[]> {
        const { data, error } = await supabase
            .from('assets')
            .select('*');

        if (error) {
            console.error('Error fetching assets:', error);
            return [];
        }

        // Map snake_case (DB) to camelCase (Frontend)
        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            internalId: row.internal_id,
            category: row.category,
            brand: row.brand,
            model: row.model,
            currentHours: row.current_hours,
            status: row.status,
            lastServiceDate: row.last_service_date,
            location: row.location
        }));
    }

    async getAssetById(id: string): Promise<Asset | undefined> {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            name: data.name,
            internalId: data.internal_id,
            category: data.category,
            brand: data.brand,
            model: data.model,
            currentHours: data.current_hours,
            status: data.status,
            lastServiceDate: data.last_service_date,
            location: data.location
        };
    }

    async getAlerts(): Promise<Alert[]> {
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('is_resolved', false); // Only fetch active alerts

        if (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            assetId: row.asset_id,
            severity: row.severity,
            description: row.description,
            isResolved: row.is_resolved,
            createdAt: row.created_at
        }));
    }

    async submitLog(log: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog> {
        // Sanitize UUIDs (Postgres throws 22P02 if string is not valid UUID)
        const isValidUUID = (id?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

        // Map camelCase to snake_case for insert
        const dbPayload = {
            asset_id: isValidUUID(log.assetId) ? log.assetId : undefined, // Fail-safe
            operator_id: isValidUUID(log.operatorId) ? log.operatorId : null,
            hours_reading: log.hoursReading,
            answers: log.answers,
            // photo_url: log.photoUrl // Add if we handle file uploads later
            gps_lat: log.gpsLocation?.lat,
            gps_lng: log.gpsLocation?.lng
        };

        if (!dbPayload.asset_id) {
            throw new Error('Invalid Asset ID (UUID required)');
        }

        const { data, error } = await supabase
            .from('daily_logs')
            .insert(dbPayload)
            .select()
            .single();

        if (error) {
            console.error('Error submitting log:', error);
            throw error;
        }

        return {
            ...log,
            id: data.id,
            createdAt: data.created_at
        };
    }

    async seedData(): Promise<void> {
        // 1. Create Organization (if not exists)
        // Since we can't easily auto-create, we assume Schema script handled structure.
        // We just insert assets.
        const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .single(); // Grab first org

        let orgId = orgData?.id;

        if (!orgId) {
            const { data: newOrg } = await supabase
                .from('organizations')
                .insert({ name: 'Demo Organization', industry: 'mining' })
                .select()
                .single();
            orgId = newOrg?.id;
        }

        if (!orgId) throw new Error('Could not create/find organization to seed.');

        const assets = [
            { org_id: orgId, name: 'Excavadora Cat 395', internal_id: 'MIN-EXC-001', category: 'heavy_machinery', brand: 'Caterpillar', model: '395 Next Gen', current_hours: 1250, status: 'active', location: 'Tajo Abierto' },
            { org_id: orgId, name: 'Perforadora Sandvik DR410i', internal_id: 'MIN-PERF-002', category: 'heavy_machinery', brand: 'Sandvik', model: 'DR410i', current_hours: 3400, status: 'warning', location: 'Nivel 4500' },
            { org_id: orgId, name: 'Tractor John Deere 8R', internal_id: 'AGRO-TRAC-045', category: 'heavy_machinery', brand: 'John Deere', model: '8R 410', current_hours: 890, status: 'down', location: 'Fundo La Joya' }
        ];

        await supabase.from('assets').insert(assets);
        console.log('Seeding complete.');
        window.location.reload();
    }

    async getPendingLogsCount(): Promise<number> {
        return await db.logs.filter(log => !log.synced).count();
    }

    async syncPendingLogs(): Promise<number> {
        if (!navigator.onLine) {
            console.log('Offline: Skipping sync');
            return 0;
        }

        const pendingLogs = await db.logs.filter(log => !log.synced).toArray();
        let syncedCount = 0;

        if (pendingLogs.length === 0) return 0;

        console.log(`Intento de sincronización: ${pendingLogs.length} pendientes...`);

        for (const log of pendingLogs) {
            try {
                // Submit to Supabase
                await this.submitLog({
                    assetId: log.assetId,
                    operatorId: log.operatorId,
                    hoursReading: log.hoursReading,
                    answers: log.answers,
                    gpsLocation: log.gpsLocation
                });

                // Mark as synced in local DB
                await db.logs.update(log.id, { synced: true });
                syncedCount++;
                console.log(`Sync success: ${log.id}`);
            } catch (error: any) {
                console.error(`Failed to sync log ${log.id}`, error);

                // Auto-cleanup bad data
                // 22P02: Invalid text representation (UUID format error)
                // 23503: Foreign key violation (Asset not found)
                if (error?.code === '22P02' || error?.code === '23503' || error?.message?.includes('Invalid Asset ID')) {
                    console.warn(`Deleting corrupted/incompatible log ${log.id} to unblock queue.`);
                    await db.logs.delete(log.id);
                }
            }
        }
        return syncedCount;
    }
}

// Export the active service
export const api = new SupabaseSentinelService();
