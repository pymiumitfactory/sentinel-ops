export interface ChecklistAnswer {
    questionId: string;
    value: string;
    severity: 'ok' | 'warning' | 'critical';
    photoUrl?: string; // Evidencia visual
    notes?: string;
}

export interface OfflineLog {
    id: string; // Temporarily generated client-side uuid
    assetId: string;
    operatorId?: string;
    hoursReading: number;
    answers: ChecklistAnswer[];
    gpsLocation?: { lat: number, lng: number };
    createdAt: number; // Timestamp
    synced: boolean;
    photoBlob?: Blob; // For offline storage
}
