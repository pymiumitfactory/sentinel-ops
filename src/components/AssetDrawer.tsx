import React, { useState, useEffect } from 'react';
import type { Asset } from '../types';
import {
    ClockIcon, MapPinIcon, ClipboardCheckIcon, EditIcon, XIcon, AlertTriangleIcon
} from './Icons';
import { ChecklistForm } from './ChecklistForm';
import { AssetHistory } from './AssetHistory';
import { AssetForm } from './AssetForm';

interface AssetDrawerProps {
    asset: Asset | null;
    onClose: () => void;
    onRefreshRequest: () => void;
    onAssetUpdate: (id: string, updates: Partial<Asset>) => Promise<void>;
    onAssetDelete: (id: string) => Promise<void>;
}

type ViewState = 'summary' | 'checklist' | 'history' | 'edit';

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
    asset, onClose, onRefreshRequest, onAssetUpdate, onAssetDelete
}) => {
    const [view, setView] = useState<ViewState>('summary');

    useEffect(() => {
        if (asset) setView('summary');
    }, [asset]);

    if (!asset) return null;

    const handleBack = () => setView('summary');

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
                {/* Drag Handle */}
                <div className="drawer-handle-area">
                    <div className="drawer-handle"></div>
                </div>

                {/* Header */}
                <div className="drawer-header" style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <h2 className="drawer-title">{asset.name}</h2>
                            <button
                                onClick={() => setView('edit')}
                                className="edit-icon-btn"
                                title="Editar Activo"
                            >
                                <EditIcon size={18} />
                            </button>
                        </div>
                        <code className="drawer-id">{asset.internalId || asset.id}</code>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <XIcon size={24} />
                    </button>
                </div>

                {/* Tabs */}
                {view !== 'edit' && view !== 'checklist' && (
                    <div className="tab-nav">
                        <button className={`tab-btn ${view === 'summary' ? 'active' : ''}`} onClick={() => setView('summary')}>Resumen</button>
                        <button className={`tab-btn ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>Historial</button>
                        {/* Checklist is a primary action, but can also be a tab if we want quick access */}
                    </div>
                )}

                {/* Content */}
                <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>

                    {view === 'summary' && (
                        <>
                            <div className="drawer-status-bar" style={{ marginBottom: '2rem' }}>
                                <span className={`status-pill status-${asset.status}`}>
                                    <span className="status-dot"></span>
                                    {asset.status.toUpperCase()}
                                </span>
                                <span className="category-tag" style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                                    {asset.brand} {asset.model}
                                </span>
                            </div>

                            {/* Primary Action */}
                            <button
                                className="login-btn"
                                style={{ marginBottom: '2rem', borderRadius: '6px' }}
                                onClick={() => setView('checklist')}
                            >
                                <ClipboardCheckIcon size={20} color="#000" />
                                INICIAR INSPECCIÓN
                            </button>

                            <div className="drawer-details">
                                <h3 className="section-label">Detalles Operativos</h3>

                                <div className="detail-row">
                                    <div className="detail-icon"><ClockIcon size={20} /></div>
                                    <div className="detail-content">
                                        <span className="detail-value">{asset.currentHours} h</span>
                                        <span className="detail-label">Horómetro Actual</span>
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-icon"><MapPinIcon size={20} /></div>
                                    <div className="detail-content">
                                        <span className="detail-value">{asset.location || 'No registrado'}</span>
                                        <span className="detail-label">Ubicación Actual</span>
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-icon"><AlertTriangleIcon size={20} color={asset.status === 'maintenance' ? 'var(--status-down)' : 'var(--text-secondary)'} /></div>
                                    <div className="detail-content">
                                        <span className="detail-value">{asset.status === 'maintenance' ? 'Requiere Atención' : 'Operativo'}</span>
                                        <span className="detail-label">Estado Técnico</span>
                                    </div>
                                </div>

                                <div className="qr-placeholder">
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.5rem' }}>Identificador Digital</p>
                                    <code style={{ color: 'var(--safety-yellow)' }}>{asset.id}</code>
                                </div>
                            </div>
                        </>
                    )}

                    {view === 'checklist' && (
                        <div className="drawer-subview">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                                <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
                                <h3 style={{ margin: 0 }}>Nueva Inspección</h3>
                            </div>
                            <ChecklistForm
                                asset={asset}
                                onClose={handleBack}
                                onSuccess={() => {
                                    onRefreshRequest();
                                    handleBack();
                                }}
                            />
                        </div>
                    )}

                    {view === 'history' && (
                        <AssetHistory
                            asset={asset}
                            onClose={handleBack}
                        />
                    )}

                    {view === 'edit' && (
                        <div className="drawer-subview">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                                <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
                                <h3 style={{ margin: 0 }}>Editar Datos</h3>
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
            </div>
        </div>
    );
};
