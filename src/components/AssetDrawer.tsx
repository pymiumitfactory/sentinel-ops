import React, { useState, useEffect } from 'react';
import type { Asset } from '../types';
import {
    ClockIcon, MapPinIcon, ClipboardCheckIcon, HistoryIcon,
    EditIcon, XIcon
} from './Icons';
import { ChecklistForm } from './ChecklistForm';
import { AssetHistory } from './AssetHistory';
import { AssetForm } from './AssetForm';

interface AssetDrawerProps {
    asset: Asset | null;
    onClose: () => void;
    // Callbacks to update parent state or trigger effects
    onRefreshRequest: () => void;
    onAssetUpdate: (id: string, updates: Partial<Asset>) => Promise<void>;
    onAssetDelete: (id: string) => Promise<void>;
}

type ViewState = 'summary' | 'checklist' | 'history' | 'edit';

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
    asset, onClose, onRefreshRequest, onAssetUpdate, onAssetDelete
}) => {
    const [view, setView] = useState<ViewState>('summary');

    // Reset view when opening new asset
    useEffect(() => {
        if (asset) setView('summary');
    }, [asset]);

    if (!asset) return null;

    const handleBack = () => setView('summary');

    // Content Render Logic
    const renderContent = () => {
        switch (view) {
            case 'checklist':
                return (
                    <div className="drawer-subview">
                        <ChecklistForm
                            asset={asset}
                            onClose={handleBack}
                            onSuccess={() => {
                                onRefreshRequest();
                                handleBack();
                            }}
                        />
                    </div>
                );
            case 'history':
                return (
                    <div className="drawer-subview">
                        <AssetHistory
                            asset={asset}
                            onClose={handleBack}
                        />
                    </div>
                );
            case 'edit':
                return (
                    <div className="drawer-subview">
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
                );
            default:
                return (
                    <>
                        <div className="drawer-status-bar">
                            <span className={`status-pill status-${asset.status}`}>
                                <span className="status-dot"></span>
                                {asset.status.toUpperCase()}
                            </span>
                            <span className="category-tag" style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                                {asset.brand} {asset.model}
                            </span>
                        </div>

                        <div className="drawer-actions">
                            <button className="action-btn primary" onClick={() => setView('checklist')}>
                                <div className="icon-circle"><ClipboardCheckIcon size={24} color="#000" /></div>
                                <span>Checklist</span>
                            </button>
                            <button className="action-btn secondary" onClick={() => setView('history')}>
                                <div className="icon-circle"><HistoryIcon size={24} color="var(--text-primary)" /></div>
                                <span>Historial</span>
                            </button>
                            <button className="action-btn secondary" onClick={() => setView('edit')}>
                                <div className="icon-circle"><EditIcon size={24} color="var(--text-primary)" /></div>
                                <span>Editar</span>
                            </button>
                        </div>

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
                                    <span className="detail-value">{asset.location}</span>
                                    <span className="detail-label">Ubicación Actual</span>
                                </div>
                            </div>

                            <div className="qr-placeholder">
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.5rem' }}>ID Sistema (QR)</p>
                                <code style={{ color: 'var(--safety-yellow)' }}>{asset.id}</code>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
                {/* Drag Handle for Mobile feel */}
                <div className="drawer-handle-area">
                    <div className="drawer-handle"></div>
                </div>

                <div className="drawer-header">
                    <div className="drawer-title-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {view !== 'summary' && (
                            <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 0.5rem 0 0' }}>
                                ←
                            </button>
                        )}
                        <div>
                            <h2 className="drawer-title">{view === 'summary' ? asset.name : view === 'checklist' ? 'Nuevo Checklist' : view === 'history' ? 'Historial' : 'Editar Activo'}</h2>
                            {view === 'summary' && <code className="drawer-id">{asset.internalId}</code>}
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <XIcon size={24} />
                    </button>
                </div>

                {renderContent()}
            </div>
        </div>
    );
};
