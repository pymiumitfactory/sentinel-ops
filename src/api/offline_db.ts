import Dexie from 'dexie';
import type { OfflineLog } from '../types/mobile_checklist';

export class SentinelDatabase extends Dexie {
    logs!: Dexie.Table<OfflineLog, string>; // 'id' as primary key

    constructor() {
        super('SentinelOpsDB');
        this.version(1).stores({
            logs: 'id, assetId, synced, createdAt'
        });
    }
}

export const db = new SentinelDatabase();
