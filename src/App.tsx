import React, { useEffect, useState, useRef } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { useToast } from './components/Toast';
import { AssetForm } from './components/AssetForm';
import { NotificationCenter } from './components/NotificationCenter';
import { AssetDrawer } from './components/AssetDrawer';
import { QRScanner } from './components/QRScanner';
import { LoginV2 as Login } from './components/LoginV2';
import { TeamManager } from './components/TeamManager';
import { DashboardStats } from './components/DashboardStats';
import { AppHeader } from './components/AppHeader';
import { AssetsView } from './components/AssetsView';
import WebMCPDemo from './components/WebMCPDemo';

import './styles/main.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/industrial-theme.css';

type ViewState = 'dashboard' | 'assets' | 'scanner' | 'settings' | 'map';

const App: React.FC = () => {
    // State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null); // Auth User

    // UI Navigation State
    const [currentView, setCurrentView] = useState<ViewState>('dashboard');

    // UI State
    const [drawerAsset, setDrawerAsset] = useState<Asset | null>(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isCreatingAsset, setIsCreatingAsset] = useState(false);
    const [showWebMCP, setShowWebMCP] = useState(false);

    // List State
    const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'critical'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const isSyncing = useRef(false);
    const { showToast } = useToast();

    // -- Auth Check --
    useEffect(() => {
        api.getCurrentUser().then((u) => {
            if (u) {
                setUser(u);
                fetchData(); // Only fetch data if logged in
            } else {
                // DEMO MODE: Bypass login
                console.log('Demo mode: logging in as dev user');
                setUser({ id: 'dev-123', email: 'dev@sentinelops.com', role: 'admin' });
                fetchData();
                setLoading(false);
            }
        });
    }, []);

    const handleLoginSuccess = async () => {
        const u = await api.getCurrentUser();
        setUser(u);
        fetchData();
    };

    const handleLogout = async () => {
        await api.signOut();
        setUser(null);
        setAssets([]);
        setAlerts([]);
    };

    // -- Data Fetching Logic --
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
            setAlerts(alertsData || []);
            setLoading(false);
            localStorage.setItem('cached_assets', JSON.stringify(assetsData));
            localStorage.setItem('cached_alerts', JSON.stringify(alertsData));
        } catch (error) {
            console.warn('Network error, keeping cached data.', error);
            if (!cachedAssets) {
                setLoading(false);
            }
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
                } catch (e) {
                    console.error(e);
                }
            }
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
    const navigateTo = (view: ViewState) => {
        setCurrentView(view);
        // Reset sub-states
        setIsNotificationOpen(false);
        if (view !== 'assets') setDrawerAsset(null);
    };

    const handleResolveAlert = async (id: string) => {
        const newAlerts = alerts.map(a => a.id === id ? { ...a, isResolved: true } : a);
        setAlerts(newAlerts);
        localStorage.setItem('cached_alerts', JSON.stringify(newAlerts));
        showToast('Alerta resuelta', 'success');
    };

    const handleSaveAsset = async (data: Partial<Asset>) => {
        try {
            if (data.id) {
                // Update existing
                await api.updateAsset(data.id, data);
                showToast('Activo actualizado', 'success');
            } else {
                // Create new
                // @ts-ignore
                await api.createAsset(data);
                showToast('Activo creado', 'success');
            }
            fetchData();
            setIsCreatingAsset(false);
        } catch (e) {
            console.error(e);
            showToast('Error al guardar', 'error');
        }
        await fetchData(); // Ensure refresh
    };

    const handleDeleteAsset = async (id: string) => {
        try {
            await api.deleteAsset(id);
            showToast('Activo eliminado', 'success');
            fetchData();
            setDrawerAsset(null);
        } catch (e) { console.error(e); showToast('Error al eliminar', 'error'); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="spinner"></div></div>;

    if (!user) {
        return <Login onSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

            {currentView !== 'scanner' && (
                <AppHeader
                    isOnline={isOnline}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    alerts={alerts}
                    user={user}
                    onScannerClick={() => navigateTo('scanner')}
                    onNotificationClick={() => setIsNotificationOpen(true)}
                    toggleWebMCP={() => setShowWebMCP(!showWebMCP)}
                    showWebMCP={showWebMCP}
                    onLogout={handleLogout}
                    navigateTo={(page) => navigateTo(page as ViewState)}
                />
            )}

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>

                {/* -- VIEW ROUTER -- */}
                {currentView === 'dashboard' && (
                    <>
                        {/* -- Dashboard Header (Matching HTML) -- */}
                        <div className="dashboard-header">
                            <div className="dashboard-title-group">
                                <h1 className="dashboard-title">THE COCKPIT</h1>
                                <p className="dashboard-subtitle">Overview of Sector 7G Operations</p>
                            </div>
                            <div className="dashboard-actions">
                                <button className="btn-secondary" onClick={() => {
                                    const csv = [
                                        ['ID', 'Name', 'Status', 'Hours'],
                                        ...assets.map(a => [a.internalId, a.name, a.status, a.currentHours])
                                    ].map(r => r.join(',')).join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `fleet_export_${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                }}>
                                    <span className="material-icon">download</span>
                                    <span className="btn-text">Export Report</span>
                                </button>
                                <button className="btn-primary" onClick={() => setIsCreatingAsset(true)}>
                                    <span className="material-icon">add</span>
                                    <span className="btn-text">New Asset</span>
                                </button>
                            </div>
                        </div>

                        <DashboardStats assets={assets} alerts={alerts} />

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>PREVIEW ASSETS</h3>
                            <AssetsView
                                assets={assets.slice(0, 4)}
                                filter={'all'}
                                onFilterChange={(f) => { setFilter(f); navigateTo('assets'); }}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                onAssetClick={setDrawerAsset}
                                loading={loading}
                            />
                            <button
                                onClick={() => navigateTo('assets')}
                                style={{
                                    width: '100%', padding: '1rem', marginTop: '1rem',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                VIEW ALL ASSETS
                            </button>
                        </div>
                    </>
                )}

                {currentView === 'assets' && (
                    <>
                        <div className="dashboard-header">
                            <div className="dashboard-title-group">
                                <h1 className="dashboard-title">ACTIVE FLEET</h1>
                                <p className="dashboard-subtitle">Managing {assets.length} industrial units</p>
                            </div>
                        </div>
                        <AssetsView
                            assets={assets}
                            filter={filter}
                            onFilterChange={setFilter}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onAssetClick={setDrawerAsset}
                            loading={loading}
                        />
                    </>
                )}

                {currentView === 'scanner' && (
                    <div style={{ padding: '2rem 0' }}>
                        <div className="dashboard-header">
                            <div className="dashboard-title-group">
                                <h1 className="dashboard-title">QR SCANNER</h1>
                                <p className="dashboard-subtitle">Sync with physical assets via camera</p>
                            </div>
                            <button className="btn-secondary" onClick={() => navigateTo('dashboard')}>Close Scanner</button>
                        </div>
                        <QRScanner
                            isOpen={true}
                            onClose={() => navigateTo('dashboard')}
                            onScan={(id) => {
                                const found = assets.find(a => a.id === id || a.internalId === id);
                                if (found) {
                                    setDrawerAsset(found);
                                    showToast(`¡Activo detectado: ${found.name}!`, 'success');
                                    navigateTo('assets');
                                } else {
                                    showToast(`Código desconocido: ${id}`, 'error');
                                }
                            }}
                            assets={assets}
                        />
                    </div>
                )}

                {currentView === 'settings' && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <h2>Settings Panel</h2>
                        <p>Configuration module under construction.</p>
                        <button className="btn-primary" onClick={() => navigateTo('dashboard')} style={{ marginTop: '1rem' }}>Return to Cockpit</button>
                    </div>
                )}

                {currentView === 'map' && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <h2>Geospatial View</h2>
                        <p>Map module requires API configuration.</p>
                        <button className="btn-primary" onClick={() => navigateTo('dashboard')} style={{ marginTop: '1rem' }}>Return to Cockpit</button>
                    </div>
                )}

            </main>

            {/* -- Drawers -- */}
            <NotificationCenter
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                alerts={alerts}
                assets={assets}
                onResolve={handleResolveAlert}
            />

            {isTeamOpen && <TeamManager onClose={() => setIsTeamOpen(false)} />}

            <AssetDrawer
                asset={drawerAsset}
                onClose={() => {
                    setDrawerAsset(null);
                    // If we were navigating via asset click from scanner, ensure consistent view state if needed.
                }}
                onRefreshRequest={fetchData}
                onAssetUpdate={async (id: string, data: Partial<Asset>) => handleSaveAsset({ ...data, id })}
                onAssetDelete={handleDeleteAsset}
            />

            {isCreatingAsset && (
                <AssetForm
                    onClose={() => setIsCreatingAsset(false)}
                    onSave={handleSaveAsset}
                />
            )}

            <WebMCPDemo
                onNavigate={(page: ViewState, filter?: string) => {
                    const validPages: ViewState[] = ['dashboard', 'assets', 'scanner', 'settings', 'map'];
                    if (validPages.includes(page)) {
                        if (page === 'assets' && filter) {
                            setFilter(filter);
                        }
                        navigateTo(page);
                    } else {
                        showToast(`Page '${page}' not found`, 'warning');
                    }
                }}
                onSimulateAlert={(msg, severity) => {
                    const newAlert: Alert = {
                        id: crypto.randomUUID(),
                        assetId: 'SYSTEM',
                        severity: severity,
                        description: msg,
                        isResolved: false,
                        createdAt: new Date().toISOString()
                    };
                    setAlerts(prev => [newAlert, ...prev]);
                    showToast(`Alert Simulated: ${msg}`, 'error');
                }}
                onShowAsset={async (id) => {
                    const found = assets.find(a => a.id === id || a.internalId === id);
                    if (found) {
                        setDrawerAsset(found);
                        return true;
                    }
                    return false;
                }}
            />
        </div>
    );
};

export default App;
