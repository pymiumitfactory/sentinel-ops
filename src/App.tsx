import React, { useEffect, useState, useRef } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { useToast } from './components/Toast';
import { AssetForm } from './components/AssetForm';
import { NotificationCenter } from './components/NotificationCenter';
import { AssetDrawer } from './components/AssetDrawer';
import { QRScanner } from './components/QRScanner';
import {
    PlusIcon
} from './components/Icons';
import { LoginV2 as Login } from './components/LoginV2';
import { TeamManager } from './components/TeamManager';
import { DashboardStats } from './components/DashboardStats';
import WebMCPDemo from './components/WebMCPDemo';

import './styles/main.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/industrial-theme.css';

const App: React.FC = () => {
    // State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null); // Auth User

    // UI State
    const [drawerAsset, setDrawerAsset] = useState<Asset | null>(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
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
            // count previously used for pending UI
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



    // Filter Logic
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.internalId.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        if (filter === 'critical') return asset.status === 'down' || asset.status === 'warning';
        if (filter === 'active') return asset.status === 'active';
        if (filter === 'maintenance') return asset.status === 'maintenance';
        return true;
    });

    return (
        <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>



            {/* -- Sticky Header -- */}
            <header className="header" style={{
                position: 'sticky', top: 0, zIndex: 1000,
                background: 'rgba(33, 28, 18, 0.95)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                minHeight: 'var(--header-height)'
            }}>
                {/* Logo & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 'fit-content' }}>
                    <div style={{ color: 'var(--safety-yellow)', display: 'flex', alignItems: 'center' }}>
                        <span className="material-icon" style={{ fontSize: '36px' }}>local_shipping</span>
                    </div>
                    <div className="hidden-on-mobile">
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
                            FLEET<span style={{ color: 'var(--safety-yellow)' }}>OPS</span>
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '6px' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="status-pulse" style={{ position: 'absolute', height: '12px', width: '12px', borderRadius: '50%', background: isOnline ? '#4ade80' : '#f87171', opacity: 0.6 }}></span>
                                <span style={{ position: 'relative', height: '8px', width: '8px', borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444', boxShadow: isOnline ? '0 0 10px #22c55e' : '0 0 10px #ef4444' }}></span>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', color: '#c5b696', letterSpacing: '0.1em' }}>
                                {isOnline ? 'Network Active' : 'Offline Manifest'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Search (Centered with constraints) */}
                <div className="header-search-container" style={{ display: 'flex', flex: 1, justifyContent: 'center', padding: '0 2rem', maxWidth: '32rem' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            type="text"
                            placeholder="OPERATIONAL SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                                borderRadius: '4px', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'white', fontSize: '0.85rem',
                                outline: 'none', fontWeight: 600, transition: 'all 0.2s',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--safety-yellow)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                        <span className="material-icon" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
                    </div>
                </div>

                {/* Header Actions & Profile */}
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 'fit-content' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setIsScannerOpen(true)} className="icon-btn-square" title="System Sync" style={{ width: '44px', height: '44px' }}>
                            <span className="material-icon">wifi</span>
                        </button>
                        <button onClick={() => setIsNotificationOpen(true)} className="icon-btn-square relative" title="Alerts" style={{ width: '44px', height: '44px' }}>
                            <span className="material-icon">notifications</span>
                            {alerts.filter(a => !a.isResolved).length > 0 && (
                                <span className="notification-dot" style={{ top: '8px', right: '8px' }}></span>
                            )}
                        </button>
                        <button onClick={() => setShowWebMCP(!showWebMCP)} className={`icon-btn-square ${showWebMCP ? 'active-tool' : ''}`} title="AI Agent Interface" style={{ width: '44px', height: '44px', color: showWebMCP ? 'var(--safety-yellow)' : 'inherit' }}>
                            <span className="material-icon">smart_toy</span>
                        </button>
                    </div>

                    <div className="user-profile-section" onClick={handleLogout} style={{ paddingLeft: '1.25rem' }}>
                        <div className="hidden-on-mobile hidden-on-tablet" style={{ textAlign: 'right' }}>
                            <p className="user-name" style={{ fontSize: '0.9rem' }}>J. Connor</p>
                            <p className="user-role" style={{ fontSize: '0.65rem' }}>Lead Dispatch</p>
                        </div>
                        <div className="user-avatar" style={{
                            width: '44px', height: '44px',
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGxFESl-udutuPfdcRycTZdN6dCMxAJJLxl6y2WvtyIJbHQAXPP-SiuxJvU6ZvT1MV3V6uO1dw44jzRjfOhhWB94Tpg_qYgd87r0V9s9h9hxZG5sag5TuJ0LtlyXUivEXxg5JrV-D2iDe0HPCDZKk93BlWsPD1NR8-BUcHPXbjOtS99sVY9OyRUqX3M1CH76kWa4JHsn0c6gM76wvxNDrEbbh38Ik8RuXp96SdXbINPmyNZDVM1GtnieJJE3juDfxujh7rND-vHg")'
                        }}></div>
                    </div>
                </div>
            </header>


            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>

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

                    {/* -- Filter Toolbar -- */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Filter Assets:</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setFilter('all')} className={`filter-pill ${filter === 'all' ? 'active' : ''}`}>All</button>
                            <button onClick={() => setFilter('active')} className={`filter-pill ${filter === 'active' ? 'active' : ''}`}>Active</button>
                            <button onClick={() => setFilter('maintenance')} className={`filter-pill ${filter === 'maintenance' ? 'active' : ''}`}>Maintenance</button>
                            <button onClick={() => setFilter('critical')} className={`filter-pill ${filter === 'critical' ? 'active' : ''}`}>Critical</button>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span className="material-icon" style={{ fontSize: '18px' }}>sort</span>
                            <span>Sort by: ID</span>
                        </div>
                    </div>

                    {/* -- Asset Grid -- */}
                    {loading && assets.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>
                    ) : (
                        <div className="asset-grid">
                            {filteredAssets.map(asset => {
                                // Dynamic rendered fields based on status
                                const isMaintenance = asset.status === 'maintenance';
                                const isCritical = asset.status === 'down';
                                const isElectric = asset.model.includes('Electric') || asset.category === 'transport';

                                return (
                                    <div
                                        key={asset.id}
                                        className="asset-card group"
                                        onClick={() => setDrawerAsset(asset)}
                                        style={isCritical ? { borderColor: 'rgba(239, 68, 68, 0.5)', boxShadow: '0 0 15px rgba(220,38,38,0.1)' } : {}}
                                    >
                                        {/* Top Half: Visual */}
                                        <div className="asset-thumbnail" style={{ height: '160px', position: 'relative', overflow: 'hidden', background: '#21262d', borderBottom: '1px solid var(--border-color)' }}>
                                            {isCritical && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444', zIndex: 20 }} className="animate-pulse"></div>}

                                            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                                                <span className={`status-badge-glass status-${asset.status}`}>
                                                    {isCritical && <span className="material-icon" style={{ fontSize: '10px', marginRight: '4px' }}>warning</span>}
                                                    {asset.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, var(--bg-card), transparent)', zIndex: 5 }}></div>

                                            <div className="thumb-bg group-hover:scale-105" style={{
                                                width: '100%', height: '100%',
                                                backgroundImage: asset.image || 'linear-gradient(45deg, #2a2417 25%, #201c12 25%, #201c12 50%, #2a2417 50%, #2a2417 75%, #201c12 75%, #201c12 100%)',
                                                backgroundSize: asset.image ? 'cover' : '20px 20px',
                                                backgroundPosition: 'center',
                                                opacity: asset.image ? 1 : 0.8,
                                                transition: 'transform 0.5s ease',
                                            }}></div>
                                        </div>

                                        {/* Bottom Half: Content */}
                                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{asset.name}</h4>
                                                    <code style={{ fontSize: '0.75rem', color: isCritical ? '#fca5a5' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {asset.internalId || asset.id.slice(0, 6)}</code>
                                                </div>
                                                <button className="edit-icon-btn">
                                                    <span className="material-icon" style={{ fontSize: '20px' }}>more_vert</span>
                                                </button>
                                            </div>

                                            {isCritical ? (
                                                <div style={{ background: 'rgba(127, 29, 29, 0.2)', border: '1px solid rgba(127, 29, 29, 0.3)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                                    <p style={{ color: '#fecaca', fontSize: '0.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span className="material-icon" style={{ fontSize: '14px' }}>thermostat</span> Engine Overheat
                                                    </p>
                                                </div>
                                            ) : (
                                                /* Details Grid */
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.8rem', marginBottom: '0.8rem' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                                                            <span className="material-icon" style={{ fontSize: '14px' }}>location_on</span>
                                                            <span>{asset.location || 'Sector 7G'}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isMaintenance ? 'ETA' : 'Operator'}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                            <span className="material-icon" style={{ fontSize: '14px' }}>{isMaintenance ? 'schedule' : 'person'}</span>
                                                            <span>{isMaintenance ? '4h 30m' : (asset.operator || 'Unassigned')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer: Progress / Fuel */}
                                            <div style={{ marginTop: 'auto', paddingTop: '0.8rem', borderTop: '1px solid #38301f' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    <span>{isMaintenance ? 'Service Progress' : (isElectric ? 'Battery' : 'Fuel Level')}</span>
                                                    <span>{isMaintenance ? '45%' : '78%'}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#38301f', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: isMaintenance ? '45%' : '78%',
                                                        height: '100%',
                                                        background: isMaintenance ? 'var(--safety-yellow)' : (isElectric ? '#10B981' : 'var(--primary-color, #d39b22)')
                                                    }} className={isMaintenance ? 'striped-bar' : ''}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            </main>
            {/* FAB */}
            <button
                className="fab-button"
                onClick={() => setIsCreatingAsset(true)}
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'var(--safety-yellow)', border: 'none',
                    boxShadow: '0 0 20px rgba(211, 155, 34, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 100
                }}
            >
                <PlusIcon size={32} color="#000" />
            </button>

            {/* -- Drawers & Modals -- */}

            <QRScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(id) => {
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

            {isTeamOpen && <TeamManager onClose={() => setIsTeamOpen(false)} />}

            {/* Asset Drawer (Main Interaction Point) */}
            <AssetDrawer
                asset={drawerAsset}
                onClose={() => setDrawerAsset(null)}
                onRefreshRequest={fetchData}
                onAssetUpdate={async (id: string, data: Partial<Asset>) => handleSaveAsset({ ...data, id })}
                onAssetDelete={handleDeleteAsset}
            />

            {/* Creating Modal (Only for NEW assets) */}
            {isCreatingAsset && (
                <AssetForm
                    onClose={() => setIsCreatingAsset(false)}
                    onSave={handleSaveAsset}
                />
            )}

            <WebMCPDemo />
        </div>
    );
};

export default App;
