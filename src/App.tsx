import React, { useEffect, useState, useRef } from 'react';
import { api } from './api/service';
import type { Asset, Alert } from './types';
import { useToast } from './components/Toast';
import { AssetForm } from './components/AssetForm';
import { NotificationCenter } from './components/NotificationCenter';
import { AssetDrawer } from './components/AssetDrawer';
import { QRScanner } from './components/QRScanner';
import {
    PlusIcon, BellIcon, MapPinIcon as LocationIcon, ScanIcon, SettingsIcon
} from './components/Icons';
import { LoginV2 as Login } from './components/LoginV2';
import { TeamManager } from './components/TeamManager';
import { DashboardStats } from './components/DashboardStats';
import { FleetMap } from './components/FleetMap';
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
                setLoading(false); // Stop loading if no user (show login)
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
                padding: '0.75rem 1.5rem',
                background: 'rgba(33, 28, 18, 0.95)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #453b26',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div className="flex items-center gap-4">
                    <div style={{ color: 'var(--safety-yellow)' }}>
                        <span className="material-icon" style={{ fontSize: '32px' }}>local_shipping</span>
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.1 }}>
                            FLEET<span style={{ color: 'var(--safety-yellow)' }}>OPS</span>
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#c5b696' }}>
                                {isOnline ? 'System Online' : 'Offline Mode'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Search & Actions */}
                <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="hidden-on-mobile" style={{ position: 'relative', width: '16rem' }}>
                        <input
                            type="text"
                            placeholder="Search Asset ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', background: '#1a160e', border: '1px solid #453b26',
                                borderRadius: '4px', padding: '0.5rem 0.75rem 0.5rem 2.25rem', color: 'white', fontSize: '0.875rem',
                                outline: 'none'
                            }}
                        />
                        <span className="material-icon" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#6b5d3a' }}>search</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setIsScannerOpen(true)} className="icon-btn-square" style={{ width: 40, height: 40, background: '#2a2417', border: '1px solid #453b26', borderRadius: '4px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icon" style={{ fontSize: '20px' }}>wifi</span>
                        </button>
                        <button onClick={() => setIsNotificationOpen(true)} className="icon-btn-square relative" style={{ width: 40, height: 40, background: '#2a2417', border: '1px solid #453b26', borderRadius: '4px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icon" style={{ fontSize: '20px' }}>notifications</span>
                            {alerts.filter(a => !a.isResolved).length > 0 && (
                                <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '1px solid #2a2417' }}></span>
                            )}
                        </button>
                    </div>

                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid #453b26', cursor: 'pointer' }}
                        onClick={handleLogout}
                    >
                        <div className="hidden-on-mobile" style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>J. Connor</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#c5b696' }}>Lead Dispatch</p>
                        </div>
                        <div style={{
                            width: 40, height: 40, borderRadius: '4px', border: '1px solid #453b26',
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGxFESl-udutuPfdcRycTZdN6dCMxAJJLxl6y2WvtyIJbHQAXPP-SiuxJvU6ZvT1MV3V6uO1dw44jzRjfOhhWB94Tpg_qYgd87r0V9s9h9hxZG5sag5TuJ0LtlyXUivEXxg5JrV-D2iDe0HPCDZKk93BlWsPD1NR8-BUcHPXbjOtS99sVY9OyRUqX3M1CH76kWa4JHsn0c6gM76wvxNDrEbbh38Ik8RuXp96SdXbINPmyNZDVM1GtnieJJE3juDfxujh7rND-vHg")'
                        }}></div>
                    </div>
                </div>
            </header>


            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>

                {/* -- Dashboard Header (Matching HTML) -- */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, color: 'white', fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em', textTransform: 'uppercase' }}>THE COCKPIT</h1>
                        <p style={{ margin: '4px 0 0', color: '#c5b696' }}>Overview of Sector 7G Operations</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="icon-btn-square" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2a2417', color: '#c5b696', border: '1px solid #453b26', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 500 }}>
                            <span className="material-icon" style={{ fontSize: '18px' }}>download</span>
                            Export Report
                        </button>
                        <button onClick={() => setIsCreatingAsset(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--safety-yellow)', color: '#201c12', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700, boxShadow: '0 0 10px rgba(211,155,34,0.3)', cursor: 'pointer' }}>
                            <span className="material-icon" style={{ fontSize: '20px' }}>add</span>
                            New Asset
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
        </div>
    );
};

export default App;
