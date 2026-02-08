import React, { useEffect, useState, useRef } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { ChecklistForm } from './components/ChecklistForm';
import { AssetHistory } from './components/AssetHistory';
import { TrendChart } from './components/TrendChart';
import { useToast } from './components/Toast';
import { AssetForm } from './components/AssetForm';
import './styles/main.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/industrial-theme.css';

const App: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null); // For Checklist
    const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);   // For History
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [isCreatingAsset, setIsCreatingAsset] = useState(false);

    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const isSyncing = useRef(false);
    const { showToast } = useToast();

    const fetchData = async () => {
        // 1. Stale-While-Revalidate: Load cache immediately
        const cachedAssets = localStorage.getItem('cached_assets');
        const cachedAlerts = localStorage.getItem('cached_alerts');

        if (cachedAssets) {
            setAssets(JSON.parse(cachedAssets));
            setLoading(false); // Show UI instantly
        }
        if (cachedAlerts) setAlerts(JSON.parse(cachedAlerts));

        // 2. Try fetching fresh data
        try {
            const [assetsData, alertsData] = await Promise.all([
                api.getAssets(),
                api.getAlerts()
            ]);

            // Update state with fresh data
            setAssets(assetsData);
            setAlerts(alertsData);
            setLoading(false);

            // Update cache
            localStorage.setItem('cached_assets', JSON.stringify(assetsData));
            localStorage.setItem('cached_alerts', JSON.stringify(alertsData));

        } catch (error) {
            console.warn('Network error, keeping cached data.', error);
            // If we have no cache and network failed, stop loading
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
                    if (synced > 0) showToast(`Sincronizados ${synced} reportes offline`, 'success');
                } catch (e) {
                    console.error(e);
                }
            }
            const count = await api.getPendingLogsCount();
            setPendingCount(count);
        } finally {
            isSyncing.current = false;
        }
    };

    // CRUD Handlers
    const handleSaveAsset = async (data: Partial<Asset>) => {
        try {
            if (editingAsset) {
                // Update
                const updated = await api.updateAsset(editingAsset.id, data);
                showToast(`Activo actualizado: ${updated.name}`, 'success');
            } else {
                // Create
                // @ts-ignore - Create expects less fields but form provides partial
                const created = await api.createAsset(data);
                showToast(`Nuevo activo creado: ${created.name}`, 'success');
            }
            fetchData(); // Refresh list
            setIsCreatingAsset(false);
            setEditingAsset(null);
        } catch (e) {
            console.error(e);
            showToast('Error al guardar activo', 'error');
        }
    };

    const handleDeleteAsset = async (id: string) => {
        try {
            await api.deleteAsset(id);
            showToast('Activo eliminado correctamente', 'success');
            fetchData(); // Refresh list
            setIsCreatingAsset(false);
            setEditingAsset(null);
        } catch (e) {
            console.error(e);
            showToast('Error al eliminar activo', 'error');
        }
    };

    useEffect(() => {
        fetchData();
        runSync();

        // Listen for online/offline status
        const handleOnline = async () => {
            setIsOnline(true);
            await runSync();
            // Refresh data after sync to show updated status (e.g. Asset turning Red)
            fetchData();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic sync check (every 30s)
        const interval = setInterval(runSync, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    if (loading && assets.length === 0) return <div style={{ color: 'white', padding: '2rem' }}>Cargando Centinela...</div>;

    return (
        <div className="app-container">
            <header className="header">
                <div className="logo">Sentinel Ops <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>MVP</span></div>
                <div className="status-indicator">
                    <span
                        className={`dot ${isOnline ? 'online' : 'offline'}`}
                        style={{ marginRight: '0.5rem' }}
                    ></span>
                    {pendingCount > 0 ? (
                        <span onClick={runSync} style={{ cursor: 'pointer', color: 'var(--safety-yellow)' }}>
                            {isSyncing.current ? 'Sincronizando...' : `OFFLINE (${pendingCount}) ↻`}
                        </span>
                    ) : (
                        <span style={{ color: isOnline ? 'var(--status-ok)' : 'var(--text-secondary)' }}>
                            {isOnline ? 'Conectado' : 'Sin Señal'}
                        </span>
                    )}
                </div>
                {/* Add Asset Button (Desktop/Mobile) */}
                <button
                    onClick={() => setIsCreatingAsset(true)}
                    style={{
                        marginLeft: '1rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        background: 'transparent',
                        border: '1px solid var(--safety-yellow)',
                        color: 'var(--safety-yellow)'
                    }}
                >
                    + NUEVO
                </button>
            </header>

            {/* Insights Section */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', color: '#8b949e', margin: 0 }}>Análisis de Salud de Flota</h2>
                    {assets.length === 0 && (
                        <button
                            onClick={() => api.seedData()}
                            style={{ backgroundColor: '#238636', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            🌱 Inicializar Base de Datos (Seed Demo)
                        </button>
                    )}
                </div>
                {assets.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#8b949e' }}>
                        <p>No hay activos registrados en la base de datos.</p>
                        <p>Haz clic en "Inicializar Base de Datos" para cargar datos de prueba.</p>
                    </div>
                ) : (
                    <div className="grid">
                        <TrendChart label="Consumo Promedio de Combustible" data={[45, 48, 42, 50, 55, 60, 58]} />
                        <TrendChart label="Horas de Operación / Día" data={[8, 10, 12, 11, 9, 8, 11]} color="#58a6ff" />
                        <TrendChart label="Detección de Vibración G (Promedio)" data={[0.2, 0.22, 0.25, 0.4, 0.35, 0.5, 0.45]} color="#d29922" />
                    </div>
                )}
            </section>

            <div className="layout-grid">
                {/* Fleet Section */}
                <section className="fleet-section">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Maquinaria Activa
                    </h2>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
                            <div className="spinner"></div>
                            <p>Cargando flota...</p>
                        </div>
                    ) : (
                        <div className="grid">
                            {assets.map(asset => (
                                <div key={asset.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: 0, cursor: 'pointer' }} onClick={() => setEditingAsset(asset)}>
                                                {asset.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✎</span>
                                            </h3>
                                            <code style={{ fontSize: '0.8rem', color: 'var(--safety-orange)' }}>{asset.internalId}</code>
                                        </div>
                                        <span className={`badge status-${asset.status}`}>{asset.status}</span>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Horas:</span>
                                            <span style={{ fontWeight: 'bold' }}>{asset.currentHours} h</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Ubicación:</span>
                                            <span>{asset.location}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setSelectedAsset(asset)} style={{ flex: 1 }}>Checklist</button>
                                        <button
                                            onClick={() => setHistoryAsset(asset)}
                                            style={{ border: '1px solid var(--border-color)' }}
                                        >
                                            Historial
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Alerts Sidebar (remains same) */}
                <section className="alerts-section">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f85149' }}>Alertas Críticas ({alerts.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {alerts.map(alert => (
                            <div key={alert.id} className="card" style={{ borderColor: '#f85149' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{alert.description}</h3>
                                <p style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    Activo: <strong>{assets.find(a => a.id === alert.assetId)?.name}</strong>
                                </p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ backgroundColor: '#f85149', color: 'white', fontSize: '0.8rem', padding: '0.5rem' }}>Resolver</button>
                                    <button style={{ backgroundColor: '#21262d', color: '#8b949e', fontSize: '0.8rem', padding: '0.5rem', border: '1px solid #30363d' }}>Ignorar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Modals */}
            {(isCreatingAsset || editingAsset) && (
                <AssetForm
                    asset={editingAsset || undefined}
                    onClose={() => { setIsCreatingAsset(false); setEditingAsset(null); }}
                    onSave={handleSaveAsset}
                    onDelete={editingAsset ? handleDeleteAsset : undefined}
                />
            )}

            {selectedAsset && (
                <ChecklistForm
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onSuccess={() => {
                        alert('Reporte guardado exitosamente (Sincronización en curso...)');
                        fetchData();
                    }}
                />
            )}

            {historyAsset && (
                <AssetHistory
                    asset={historyAsset}
                    onClose={() => setHistoryAsset(null)}
                />
            )}
        </div>
    );
};

export default App;
