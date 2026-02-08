import { supabase } from './supabaseClient';
import { db } from './offline_db';
import type { Asset, Alert, MaintenanceLog } from '../types';

// Interface
export interface SentinelDataService {
    getAssets(): Promise<Asset[]>;
    getAssetById(id: string): Promise<Asset | undefined>;
    getAssetLogs(assetId: string): Promise<MaintenanceLog[]>; // New method
    getAlerts(): Promise<Alert[]>;
    submitLog(log: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog>;
    seedData(): Promise<void>;
    syncPendingLogs(): Promise<number>;
    getPendingLogsCount(): Promise<number>;
}

// Supabase Implementation
class SupabaseSentinelService implements SentinelDataService {

    // ... existing methods ...
    async getAssets(): Promise<Asset[]> {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('name'); // Sort by name

        if (error) {
            console.error('Error fetching assets:', error);
            throw error; // Throw to trigger offline cache in App.tsx
        }

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

    // ... getAssetById ...
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

    // New: Get logs for specific asset
    async getAssetLogs(assetId: string): Promise<MaintenanceLog[]> {
        const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('asset_id', assetId)
            .order('created_at', { ascending: false }); // Newest first

        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            assetId: row.asset_id,
            operatorId: row.operator_id,
            hoursReading: row.hours_reading,
            answers: row.answers,
            photoUrl: row.photo_url,
            gpsLocation: { lat: row.gps_lat, lng: row.gps_lng },
            createdAt: row.created_at
        }));
    }

    async getAlerts(): Promise<Alert[]> {
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('is_resolved', false);

        if (error) {
            console.error('Error fetching alerts:', error);
            throw error; // Throw so App can use cached alerts
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
        const isValidUUID = (id?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

        const dbPayload = {
            asset_id: isValidUUID(log.assetId) ? log.assetId : undefined,
            operator_id: isValidUUID(log.operatorId) ? log.operatorId : null,
            hours_reading: log.hoursReading,
            answers: log.answers,
            // photo_url: log.photoUrl // Still todo: upload logic
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
        const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .single();

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

                // Mark as synced
                await db.logs.update(log.id, { synced: true });
                syncedCount++;
                console.log(`Sync success: ${log.id}`);
            } catch (error: any) {
                console.error(`Failed to sync log ${log.id}`, error);

                if (error?.code === '22P02' || error?.code === '23503' || error?.message?.includes('Invalid Asset ID')) {
                    console.warn(`Deleting corrupted/incompatible log ${log.id} to unblock queue.`);
                    await db.logs.delete(log.id);
                }
            }
        }
        return syncedCount;
    }
}

export const api = new SupabaseSentinelService();
