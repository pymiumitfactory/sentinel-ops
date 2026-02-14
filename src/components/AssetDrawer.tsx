import React, { useState, useEffect } from 'react';
import type { Asset } from '../types';
import {
    ClockIcon, MapPinIcon, ClipboardCheckIcon, EditIcon, XIcon, AlertTriangleIcon
} from './Icons';
import { ChecklistForm } from './ChecklistForm';
import { AssetHistory } from './AssetHistory';
import { AssetForm } from './AssetForm';
import { InspectionDetail } from './InspectionDetail';
import type { MaintenanceLog } from '../types';

interface AssetDrawerProps {
    asset: Asset | null;
    onClose: () => void;
    onRefreshRequest: () => void;
    onAssetUpdate: (id: string, updates: Partial<Asset>) => Promise<void>;
    onAssetDelete: (id: string) => Promise<void>;
}

type ViewState = 'summary' | 'checklist' | 'history' | 'edit' | 'inspection_detail';

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
    asset, onClose, onRefreshRequest, onAssetUpdate, onAssetDelete
}) => {
    const [view, setView] = useState<ViewState>('summary');
    const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

    useEffect(() => {
        if (asset) setView('summary');
    }, [asset]);

    if (!asset) return null;

    const handleBack = () => setView('summary');

    // Mapped Status Colors
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active': return { label: 'Operacional', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'maintenance': return { label: 'En Mantenimiento', color: '#d39b22', bg: 'rgba(211, 155, 34, 0.1)' };
            case 'down': return { label: 'Fuera de Servicio', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
            default: return { label: status.toUpperCase(), color: '#c5b696', bg: '#2a2417' };
        }
    };

    const statusInfo = getStatusConfig(asset.status);

    return (
        <div
            className="drawer-overlay"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(0, 0, 0, 0.7)', zIndex: 2000 }}
            onClick={onClose}
        >
            <aside
                className="drawer-panel"
                style={{
                    width: '560px',
                    maxWidth: '100%',
                    borderLeft: '1px solid #453b26',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#201c12'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Hero Section (Hidden in Action/Detail views for focus) */}
                {view === 'summary' || view === 'history' ? (
                    <div style={{ position: 'relative', width: '100%', height: '240px', flexShrink: 0 }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${asset.image || 'https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=1000&auto=format&fit=crop'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, #201c12, rgba(32, 28, 18, 0.6), transparent)'
                            }}></div>
                        </div>

                        {/* Header Controls */}
                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                            <button
                                onClick={() => setView('edit')}
                                style={{
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                <EditIcon size={20} />
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        {/* Top Identity Info */}
                        <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{
                                    background: statusInfo.bg, color: statusInfo.color,
                                    border: `1px solid ${statusInfo.color}40`, padding: '2px 8px',
                                    borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {statusInfo.label}
                                </span>
                                <span style={{
                                    background: 'rgba(42, 36, 23, 0.8)', color: '#c5b696',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                                    fontWeight: 600, backdropFilter: 'blur(4px)'
                                }}>
                                    ID: {asset.internalId}
                                </span>
                            </div>
                            <h1 style={{ margin: 0, color: 'white', fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                {asset.name}
                            </h1>
                            <p style={{ margin: '4px 0 0', color: '#c5b696', fontSize: '0.85rem', fontWeight: 500 }}>
                                {asset.brand} {asset.model} • {asset.location || 'Sector 7G'}
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Navigation Tabs (Sticky) */}
                {view === 'summary' || view === 'history' ? (
                    <nav style={{
                        display: 'flex', borderBottom: '1px solid #453b26', background: '#201c12',
                        padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 20
                    }}>
                        <button
                            onClick={() => setView('summary')}
                            style={{
                                padding: '1.25rem 1rem', background: 'transparent', border: 'none',
                                borderBottom: `3px solid ${view === 'summary' ? '#d39b22' : 'transparent'}`,
                                color: view === 'summary' ? 'white' : '#c5b696', fontSize: '0.75rem',
                                fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >Resumen</button>
                        <button
                            onClick={() => setView('history')}
                            style={{
                                padding: '1.25rem 1rem', background: 'transparent', border: 'none',
                                borderBottom: `3px solid ${view === 'history' ? '#d39b22' : 'transparent'}`,
                                color: view === 'history' ? 'white' : '#c5b696', fontSize: '0.75rem',
                                fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >Historial</button>
                    </nav>
                ) : null}

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: (view === 'summary' || view === 'history') ? '1.5rem' : 0, paddingBottom: view === 'summary' ? '100px' : 0 }} className="rugged-scroll">
                    {view === 'summary' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Quick Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: '#2a2417', border: '1px solid #453b26', padding: '1rem', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c5b696', marginBottom: '4px' }}>
                                        <ClockIcon size={16} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Hours</span>
                                    </div>
                                    <p style={{ margin: 0, color: '#d39b22', fontSize: '1.75rem', fontWeight: 900 }}>
                                        {asset.currentHours.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'white', opacity: 0.6 }}>HRS</span>
                                    </p>
                                </div>
                                <div style={{ background: '#2a2417', border: '1px solid #453b26', padding: '1rem', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c5b696', marginBottom: '4px' }}>
                                        <AlertTriangleIcon size={16} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Service</span>
                                    </div>
                                    <p style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>
                                        {asset.lastServiceDate ? new Date(asset.lastServiceDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Technical Specifications */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #453b26', paddingBottom: '8px', marginBottom: '1.25rem' }}>
                                    <span className="material-icon" style={{ color: '#d39b22', fontSize: '20px' }}>analytics</span>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>Especificaciones Técnicas</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                                    {[
                                        { label: 'Manufacturer', value: asset.brand },
                                        { label: 'Model Specification', value: asset.model },
                                        { label: 'Unit Identifier', value: asset.internalId },
                                        { label: 'Deployment Class', value: asset.category.replace('_', ' ').toUpperCase() },
                                        { label: 'Operational Weight', value: '21,700 KG' }, // Mocking dossier details
                                        { label: 'Fuel Capacity', value: '410 L' },
                                        { label: 'Engine Type', value: 'Cat C4.4 ACERT' },
                                        { label: 'Net Power', value: '107 kW' }
                                    ].map((spec, i) => (
                                        <div key={i} style={{ borderBottom: '1px solid #2a2417', padding: '12px 0' }}>
                                            <p style={{ margin: 0, color: '#6b5d3a', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{spec.label}</p>
                                            <p style={{ margin: '2px 0 0', color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>{spec.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Location Section */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <span className="material-icon" style={{ color: '#d39b22', fontSize: '20px' }}>location_on</span>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>Ubicación Actual</h3>
                                </div>
                                <div style={{
                                    width: '100%', height: '160px', background: '#2a2417', borderRadius: '4px',
                                    border: '1px solid #453b26', overflow: 'hidden', position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute', inset: 0, opacity: 0.4,
                                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDM0T9fyDDCQexKWvI74cT6YXgPvHV2yW15y8p4dYs1WsQ5XxImd6tay56PJ6Mo2OHdtCzB2b8F_mgoEIUQGIjnsXGdw9XnloNYJyJOCU1iM7lf5KyCp_mZ1ZaDNckUeZcKXvCeZs7c4w70MNakNh6jEg-t8TFd_cxMCQ9vssIdYkBePV4Xzlg9aLsXhi2-GFEbGKoQH4xuk4UZ-7Vgin_hH8SI6gqBS92qS_3DDK8Hym5udPFoDDWpd9kE7NKg9mLiXeIh0GmAEA")',
                                        backgroundSize: 'cover', backgroundPosition: 'center'
                                    }}></div>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <button style={{
                                            background: 'rgba(32, 28, 18, 0.8)', color: 'white', padding: '10px 16px',
                                            borderRadius: '4px', border: '1px solid #453b26', fontSize: '0.75rem',
                                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            <span className="material-icon" style={{ fontSize: '16px' }}>open_in_new</span>
                                            VISUALIZAR RADAR
                                        </button>
                                    </div>
                                </div>
                                <p style={{ margin: '8px 0 0', color: '#6b5d3a', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span className="material-icon" style={{ fontSize: '12px' }}>info</span>
                                    SYSTEM LINK ACTIVE • RADIUS: 15M
                                </p>
                            </div>
                        </div>
                    )}

                    {view === 'history' && (
                        <AssetHistory
                            asset={asset}
                            onViewLog={(log) => {
                                setSelectedLog(log);
                                setView('inspection_detail');
                            }}
                        />
                    )}

                    {view === 'inspection_detail' && selectedLog && (
                        <InspectionDetail
                            asset={asset}
                            log={selectedLog}
                            onClose={() => setView('history')}
                        />
                    )}

                    {view === 'checklist' && (
                        <ChecklistForm
                            asset={asset}
                            onClose={handleBack}
                            onSuccess={() => {
                                onRefreshRequest();
                                handleBack();
                            }}
                        />
                    )}

                    {view === 'edit' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: '#c5b696', cursor: 'pointer' }}>
                                    <span className="material-icon">arrow_back</span>
                                </button>
                                <h3 style={{ margin: 0, color: 'white', fontWeight: 800 }}>REVISIÓN TÉCNICA</h3>
                            </div>
                            <AssetForm
                                asset={asset}
                                onClose={handleBack}
                                onSave={async (data) => {
                                    await onAssetUpdate(asset.id, data);
                                    handleBack();
                                }}
                                onDelete={async (id) => {
                                    await onAssetDelete(id);
                                    onClose();
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Sticky Action Footer */}
                {view === 'summary' && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem',
                        background: '#201c12', borderTop: '1px solid #453b26', zIndex: 30,
                        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                            onClick={() => setView('checklist')}
                        >
                            <span className="material-icon" style={{ fontWeight: 900 }}>assignment_add</span>
                            INICIAR INSPECCIÓN OPERATIVA
                        </button>
                    </div>
                )}
            </aside>
        </div>
    );
};
