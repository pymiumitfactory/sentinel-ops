import React, { useEffect, useState, useRef } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { ChecklistForm } from './components/ChecklistForm';
import { AssetHistory } from './components/AssetHistory';
import { TrendChart } from './components/TrendChart';
import './styles/main.css';

const App: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null); // For Checklist
    const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);   // For History

    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const isSyncing = useRef(false);

    // ... (fetchData and runSync remain same)

    // ... (useEffect remains same)

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Cargando Centinela...</div>;

    return (
        <div className="dashboard">
            {/* ... (Header and Insights remain same) ... */}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
                {/* Fleet Section */}
                <section className="fleet-section">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Maquinaria Activa (Minería & Agro)</h2>
                    <div className="grid">
                        {assets.map(asset => (
                            <div key={asset.id} className="card">
                                {/* ... (Asset Card Header) ... */}
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
                                    <button
                                        onClick={() => setHistoryAsset(asset)}
                                        style={{ backgroundColor: '#21262d', border: '1px solid #30363d' }}
                                    >
                                        Historial
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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
