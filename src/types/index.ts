export type AssetStatus = 'active' | 'warning' | 'down' | 'maintenance' | 'offline';
export type AssetCategory = 'heavy_machinery' | 'irrigation_system' | 'transport';

export interface AsyncTaskState {
    loading: boolean;
    error: string | null;
}

export interface Asset {
    id: string;
    orgId?: string; // Optional for frontend but exists in DB
    name: string;
    internalId: string;
    category: AssetCategory;
    brand: string;
    model: string;
    currentHours: number;
    status: AssetStatus;
    lastServiceDate: string;
    location?: string;
    operator?: string;
    image?: string;
}

export interface MaintenanceLog {
    id: string;
    assetId: string;
    operatorId?: string;
    hoursReading: number;
    answers: any; // Can be object or array of answers
    photoUrl?: string;
    gpsLocation?: { lat: number, lng: number };
    createdAt: string;
}

export interface Alert {
    id: string;
    assetId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    isResolved: boolean;
    createdAt: string;
}

// Ensure ChecklistItem is exported for ChecklistForm.tsx
export interface ChecklistItem {
    id: string;
    label: string;
    type: 'boolean' | 'ok_fail' | 'number';
}

// Re-export specific types if needed
export * from './mobile_checklist';
