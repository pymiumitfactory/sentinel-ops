export type AssetStatus = 'active' | 'warning' | 'down' | 'maintenance';
export type AssetCategory = 'heavy_machinery' | 'irrigation_system' | 'transport';

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

// Re-export specific types if needed
export * from './mobile_checklist';
