import { supabase } from './supabaseClient';
import { db } from './offline_db';
import type { Asset, Alert, MaintenanceLog } from '../types';

// Interface
export interface SentinelDataService {
    getAssets(): Promise<Asset[]>;
    getAssetById(id: string): Promise<Asset | undefined>;
    createAsset(asset: Omit<Asset, 'id' | 'currentHours' | 'status' | 'lastServiceDate'>): Promise<Asset>; // New
    updateAsset(id: string, updates: Partial<Asset>): Promise<Asset>; // New
    deleteAsset(id: string): Promise<void>; // New
    getAssetLogs(assetId: string): Promise<MaintenanceLog[]>;
    getAlerts(): Promise<Alert[]>;
    submitLog(log: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog>;
    seedData(): Promise<void>;
    syncPendingLogs(): Promise<number>;
    getPendingLogsCount(): Promise<number>;
    createLog(payload: { assetId: string, type: string, data: any, location?: string, photoFile?: File }): Promise<void>;
    uploadPhoto(file: File, folder: string): Promise<string | null>;
    signIn(email: string, password: string): Promise<{ user: any, error: any }>;
    signOut(): Promise<void>;
    getCurrentUser(): Promise<any>;
}

// Supabase Implementation
class SupabaseSentinelService implements SentinelDataService {

    // ... (getAssets remains same) ...
    // ... (getAssetById remains same) ...

    async createAsset(asset: Omit<Asset, 'id' | 'currentHours' | 'status' | 'lastServiceDate'>): Promise<Asset> {
        // Get org_id (assuming single org for MVP)
        const { data: orgData } = await supabase.from('organizations').select('id').single();
        if (!orgData) throw new Error('No organization found');

        const payload = {
            org_id: orgData.id,
            name: asset.name,
            internal_id: asset.internalId,
            category: asset.category,
            brand: asset.brand,
            model: asset.model,
            location: asset.location,
            status: 'active', // Default
            current_hours: 0
        };

        const { data, error } = await supabase
            .from('assets')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Error creating asset:', error);
            throw error;
        }

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

    async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.internalId) payload.internal_id = updates.internalId;
        if (updates.category) payload.category = updates.category;
        if (updates.brand) payload.brand = updates.brand;
        if (updates.model) payload.model = updates.model;
        if (updates.location) payload.location = updates.location;
        if (updates.currentHours !== undefined) payload.current_hours = updates.currentHours;
        if (updates.status) payload.status = updates.status;

        const { data, error } = await supabase
            .from('assets')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating asset:', error);
            throw error;
        }

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

    async deleteAsset(id: string): Promise<void> {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting asset:', error);
            throw error;
        }
    }

    // ... (getAssetLogs starts here) ...
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
        return await db.logs.where('synced').equals(0).count(); // Dexie boolean index issue, use 0/1 or iterate
    }

    async syncPendingLogs(): Promise<number> {
        if (!navigator.onLine) return 0;

        const pendingLogs = await db.logs.filter(log => !log.synced).toArray();
        let syncedCount = 0;

        if (pendingLogs.length === 0) return 0;
        console.log(`Syncing ${pendingLogs.length} logs...`);

        for (const log of pendingLogs) {
            try {
                let photoUrl = null;
                // Upload blob if exists
                if (log.photoBlob) {
                    // Convert blob back to File for uploadPhoto
                    const file = new File([log.photoBlob], `offline_photo_${log.id}.jpg`, { type: log.photoBlob.type });
                    photoUrl = await this.uploadPhoto(file, log.assetId);
                }

                const logEntry: Omit<MaintenanceLog, 'id' | 'createdAt'> = {
                    assetId: log.assetId,
                    operatorId: undefined,
                    hoursReading: log.hoursReading,
                    answers: log.answers,
                    gpsLocation: log.gpsLocation,
                    photoUrl: photoUrl || undefined
                };

                await this.submitLog(logEntry);

                // Remove from local DB after success
                await db.logs.delete(log.id);
                syncedCount++;
            } catch (error) {
                console.error(`Failed to sync log ${log.id}`, error);
            }
        }
        return syncedCount;
    }

    async uploadPhoto(file: File, folder: string): Promise<string | null> {
        try {
            const fileName = `${folder}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
            const { error } = await supabase.storage
                .from('checklist-photos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('checklist-photos')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading photo:', error);
            return null;
        }
    }

    async createLog(payload: { assetId: string, type: string, data: any, location?: string, photoFile?: File }): Promise<void> {
        const isOffline = !navigator.onLine;

        // Extract basic data
        const hoursReading = payload.data?.items?.horometer
            ? Number(payload.data.items.horometer)
            : 0;

        let gpsLocation = undefined;
        if (payload.data?.location) {
            gpsLocation = payload.data.location;
        } else if (payload.location) {
            const [lat, lng] = payload.location.split(',').map((n: string) => Number(n.trim()));
            if (!isNaN(lat) && !isNaN(lng)) gpsLocation = { lat, lng };
        }

        try {
            if (isOffline) throw new Error('Offline Mode');

            const { user, orgId } = await this._getUserContext();

            let photoUrl = null;
            if (payload.photoFile) {
                photoUrl = await this.uploadPhoto(payload.photoFile, payload.assetId);
            }

            const logEntry: Omit<MaintenanceLog, 'id' | 'createdAt'> = {
                assetId: payload.assetId,
                operatorId: user.id, // Now using real User ID!
                hoursReading: hoursReading,
                answers: payload.data, // Store full JSON data
                photoUrl: photoUrl || undefined, // Add the uploaded URL
                gpsLocation: gpsLocation
            };

            // Ensure createLog passes org_id implicitly via RLS or explicit insert if needed
            // For MVP strictness, we might want to validate asset belongs to orgId here too

            await this.submitLog(logEntry);

        } catch (error) {
            console.warn('Network/Upload failed, saving locally:', error);

            // Save to Dexie for later sync
            await db.logs.add({
                id: crypto.randomUUID(),
                assetId: payload.assetId,
                answers: payload.data, // Should match ChecklistAnswer[] roughly or fail gracefully
                hoursReading: hoursReading,
                gpsLocation: gpsLocation,
                createdAt: Date.now(),
                synced: false,
                photoBlob: payload.photoFile // Store the FILE object (Blob compatible)
            });
        }
    }
}

    // -- Auth Methods --
    async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
}

    async signOut() {
    return await supabase.auth.signOut();
}

    async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

    // -- Private Helper for Multi-tenancy --
    private async _getUserContext() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // 1. Try fetching from profiles (Source of Truth)
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    // 2. Fallback to metadata or default (for development/legacy)
    const orgId = profile?.org_id || user.user_metadata?.org_id;

    if (!orgId) {
        console.warn('Usuario sin organización asignada. Modo restringido.');
    }

    return { user, orgId };
}
}

export const api = new SupabaseSentinelService();
```
