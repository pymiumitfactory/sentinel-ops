import React, { useEffect, useState } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { ChecklistForm } from './components/ChecklistForm';
import { TrendChart } from './components/TrendChart';
import './styles/main.css';

const App: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const isSyncing = React.useRef(false);

    const fetchData = async () => {
        const [assetsData, alertsData] = await Promise.all([
            api.getAssets(),
            api.getAlerts()
        ]);
        setAssets(assetsData);
        setAlerts(alertsData);
        setLoading(false);
    };

    const runSync = async () => {
        if (isSyncing.current) return;
        isSyncing.current = true;

        try {
            if (navigator.onLine) {
                await api.syncPendingLogs();
            }
            const count = await api.getPendingLogsCount();
            setPendingCount(count);
        } finally {
            isSyncing.current = false;
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

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Cargando Centinela...</div>;

    return (
        <div className="dashboard">
            <header className="header">
                <div className="logo">SENTINEL OPS</div>
                <div className="status-indicator">
                    {!isOnline ? (
                        <span className="badge status-down">Offline ({pendingCount} pendientes)</span>
                    ) : pendingCount > 0 ? (
                        <span className="badge status-warning">Sincronizando ({pendingCount})...</span>
                    ) : (
                        <span className="badge status-active">Online / Sync OK</span>
                    )}
                </div>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
                {/* Fleet Section */}
                <section className="fleet-section">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Maquinaria Activa (Minería & Agro)</h2>
                    <div className="grid">
                        {assets.map(asset => (
                            <div key={asset.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{asset.name}</h3>
                                        <code style={{ fontSize: '0.8rem', color: '#58a6ff' }}>{asset.internalId}</code>
                                    </div>
                                    <span className={`badge status-${asset.status}`}>{asset.status}</span>
                                </div>

                                <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#8b949e' }}>Horas de Uso:</span>
                                        <span>{asset.currentHours} h</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#8b949e' }}>Ubicación:</span>
                                        <span>{asset.location}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setSelectedAsset(asset)} style={{ flex: 1 }}>Checklist</button>
                                    <button style={{ backgroundColor: '#21262d', border: '1px solid #30363d' }}>Historial</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Alerts Sidebar */}
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

            {/* Modal Form */}
            {selectedAsset && (
                <ChecklistForm
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onSuccess={() => {
                        alert('Reporte guardado exitosamente (Sincronización simulada completada)');
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default App;
