import React from 'react';
import type { Asset } from '../types';

interface AssetsViewProps {
    assets: Asset[];
    filter: 'all' | 'active' | 'maintenance' | 'critical';
    onFilterChange: (filter: 'all' | 'active' | 'maintenance' | 'critical') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAssetClick: (asset: Asset) => void;
    loading: boolean;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
    assets, filter, onFilterChange, searchQuery, onSearchChange, onAssetClick, loading
}) => {
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
        <div className="assets-view">
            {/* -- Filter Toolbar -- */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Filter Assets:</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => onFilterChange('all')} className={`filter-pill ${filter === 'all' ? 'active' : ''}`}>All</button>
                    <button onClick={() => onFilterChange('active')} className={`filter-pill ${filter === 'active' ? 'active' : ''}`}>Active</button>
                    <button onClick={() => onFilterChange('maintenance')} className={`filter-pill ${filter === 'maintenance' ? 'active' : ''}`}>Maintenance</button>
                    <button onClick={() => onFilterChange('critical')} className={`filter-pill ${filter === 'critical' ? 'active' : ''}`}>Critical</button>
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
                        const isMaintenance = asset.status === 'maintenance';
                        const isCritical = asset.status === 'down';
                        const isElectric = asset.model.includes('Electric') || asset.category === 'transport';

                        return (
                            <div
                                key={asset.id}
                                className="asset-card group"
                                onClick={() => onAssetClick(asset)}
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
        </div>
    );
};
