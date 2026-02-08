import React, { useEffect, useState, useRef } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { ChecklistForm } from './components/ChecklistForm';
import { AssetHistory } from './components/AssetHistory';
import { useToast } from './components/Toast';
import { AssetForm } from './components/AssetForm';
import { NotificationCenter } from './components/NotificationCenter';
import { AssetDrawer } from './components/AssetDrawer';
import { QRScanner } from './components/QRScanner';
import {
    PlusIcon, AlertTriangleIcon, BellIcon, MapPinIcon as LocationIcon, ScanIcon
} from './components/Icons';
import './styles/main.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/industrial-theme.css';

const App: React.FC = () => {
    // State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [drawerAsset, setDrawerAsset] = useState<Asset | null>(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Legacy Modals (Triggered from Drawer)
    const [checklistAsset, setChecklistAsset] = useState<Asset | null>(null);
    const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [isCreatingAsset, setIsCreatingAsset] = useState(false);

    // Sync State
    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const isSyncing = useRef(false);
    const { showToast } = useToast();

    // -- Data Fetching Logic (Same as before) --
    const fetchData = async () => {
        const cachedAssets = localStorage.getItem('cached_assets');
        const cachedAlerts = localStorage.getItem('cached_alerts');

        if (cachedAssets) {
            setAssets(JSON.parse(cachedAssets));
            setLoading(false);
        }
        if (cachedAlerts) setAlerts(JSON.parse(cachedAlerts));

        try {
            const [assetsData, alertsData] = await Promise.all([
                api.getAssets(),
                api.getAlerts()
            ]);
            setAssets(assetsData);
            setAlerts(alertsData);
            setLoading(false);
            localStorage.setItem('cached_assets', JSON.stringify(assetsData));
            localStorage.setItem('cached_alerts', JSON.stringify(alertsData));
        } catch (error) {
            console.warn('Network error, keeping cached data.', error);
            if (!cachedAssets) setLoading(false);
        }
    };

    const runSync = async () => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        try {
            if (navigator.onLine) {
                try {
                    const synced = await api.syncPendingLogs();
                    if (synced > 0) showToast(`Sincronizados ${synced} reportes`, 'success');
                } catch (e) { console.error(e); }
            }
            const count = await api.getPendingLogsCount();
            setPendingCount(count);
        } finally {
            isSyncing.current = false;
        }
    };

    useEffect(() => {
        fetchData();
        const syncInterval = setInterval(() => { if (navigator.onLine) runSync(); }, 60000);
        const handleOnline = () => { setIsOnline(true); runSync(); fetchData(); };
        const handleOffline = () => { setIsOnline(false); showToast('Modo Offline', 'error'); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // -- Action Handlers --
    const handleResolveAlert = async (id: string) => {
        // Mock resolve for MVP
        const newAlerts = alerts.map(a => a.id === id ? { ...a, isResolved: true } : a);
        setAlerts(newAlerts);
        localStorage.setItem('cached_alerts', JSON.stringify(newAlerts));
        showToast('Alerta resuelta', 'success');
    };

    const handleSaveAsset = async (data: Partial<Asset>) => {
        try {
            if (editingAsset) {
                await api.updateAsset(editingAsset.id, data);
                showToast('Activo actualizado', 'success');
            } else {
                // @ts-ignore
                await api.createAsset(data);
                showToast('Activo creado', 'success');
            }
            fetchData();
            setIsCreatingAsset(false);
            setEditingAsset(null);
            setDrawerAsset(null); // Close drawer if open
        } catch (e) {
            console.error(e);
            showToast('Error al guardar', 'error');
        }
    };

    const handleDeleteAsset = async (id: string) => {
        try {
            await api.deleteAsset(id);
            showToast('Activo eliminado', 'success');
            fetchData();
            setEditingAsset(null);
            setDrawerAsset(null);
        } catch (e) { console.error(e); showToast('Error al eliminar', 'error'); }
    };

    return (
        <div className="app-container">
            {/* -- Minimal Header -- */}
            <header className="header">
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangleIcon size={24} color="var(--safety-yellow)" />
                    Sentinel Ops
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {/* Offline Indicator */}
                    {(pendingCount > 0 || !isOnline) && (
                        <span
                            onClick={runSync}
                            style={{
                                fontSize: '0.7rem',
                                color: !isOnline ? 'var(--text-secondary)' : 'var(--safety-orange)',
                                border: '1px solid currentColor',
                                padding: '2px 6px',
                                borderRadius: '12px'
                            }}
                        >
                            {!isOnline ? 'OFFLINE' : `SYNC ${pendingCount}`}
                        </span>
                    )}

                    {/* QR Scanner Button */}
                    <button
                        className="icon-btn"
                        onClick={() => setIsScannerOpen(true)}
                        title="Escanear Activo"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px' }}
                    >
                        <ScanIcon size={22} />
                    </button>

                    {/* Notification Bell */}
                    <button
                        className="icon-btn"
                        onClick={() => setIsNotificationOpen(true)}
                        style={{ position: 'relative', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px' }}
                    >
                        <BellIcon size={22} />
                        {alerts.filter(a => !a.isResolved).length > 0 && (
                            <span style={{
                                position: 'absolute', top: 2, right: 2,
                                width: 8, height: 8, borderRadius: '50%',
                                background: 'var(--status-down)', border: '1px solid var(--bg-primary)'
                            }}></span>
                        )}
                    </button>
                </div>
            </header>

            {/* -- Main Feed -- */}
            <main style={{ paddingBottom: '80px' }}> {/* Space for FAB */}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: 0 }}>Flota Activa</h2>
                </div>

                {loading && assets.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>
                ) : (
                    <div className="grid">
                        {assets.map(asset => (
                            <div
                                key={asset.id}
                                className="card asset-card-minimal"
                                onClick={() => setDrawerAsset(asset)}
                                style={{ cursor: 'pointer', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className={`status-dot-large status-${asset.status}`} style={{ width: 12, height: 12, borderRadius: '50%', background: 'currentColor' }}></div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{asset.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            <LocationIcon size={12} />
                                            <span>{asset.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ fontSize: '1.2rem' }}>›</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FAB */}
            <button
                className="fab-button"
                onClick={() => setIsCreatingAsset(true)}
            >
                <PlusIcon size={32} color="#000" />
            </button>

            {/* -- Drawers & Modals -- */}

            <QRScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(id) => {
                    // Try to match by ID or Internal ID
                    const found = assets.find(a => a.id === id || a.internalId === id);
                    if (found) {
                        setDrawerAsset(found);
                        showToast(`¡Activo detectado: ${found.name}!`, 'success');
                    } else {
                        showToast(`Código desconocido: ${id}`, 'error');
                    }
                }}
                assets={assets}
            />

            <NotificationCenter
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                alerts={alerts}
                assets={assets}
                onResolve={handleResolveAlert}
            />

            <AssetDrawer
                asset={drawerAsset}
                onClose={() => setDrawerAsset(null)}
                onChecklist={(a) => { setDrawerAsset(null); setChecklistAsset(a); }}
                onHistory={(a) => { setDrawerAsset(null); setHistoryAsset(a); }}
                onEdit={(a) => { setDrawerAsset(null); setEditingAsset(a); }}
            />

            {/* Sub-Modals (Triggered from Drawer) */}
            {checklistAsset && (
                <ChecklistForm
                    asset={checklistAsset}
                    onClose={() => setChecklistAsset(null)}
                    onSuccess={() => { showToast('Checklist guardado', 'success'); fetchData(); }}
                />
            )}

            {historyAsset && (
                <AssetHistory
                    asset={historyAsset}
                    onClose={() => setHistoryAsset(null)}
                />
            )}

            {(isCreatingAsset || editingAsset) && (
                <AssetForm
                    asset={editingAsset || undefined}
                    onClose={() => { setIsCreatingAsset(false); setEditingAsset(null); }}
                    onSave={handleSaveAsset}
                    onDelete={editingAsset ? handleDeleteAsset : undefined}
                />
            )}
        </div>
    );
};

export default App;
