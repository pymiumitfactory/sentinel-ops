import React from 'react';
import type { Asset } from '../types';
import {
    ClockIcon, MapPinIcon, ClipboardCheckIcon, HistoryIcon,
    EditIcon, XIcon
} from './Icons';

interface AssetDrawerProps {
    asset: Asset | null;
    onClose: () => void;
    onEdit: (asset: Asset) => void;
    onChecklist: (asset: Asset) => void;
    onHistory: (asset: Asset) => void;
}

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
    asset, onClose, onEdit, onChecklist, onHistory
}) => {
    if (!asset) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
                {/* Drag Handle for Mobile feel */}
                <div className="drawer-handle-area">
                    <div className="drawer-handle"></div>
                </div>

                <div className="drawer-header">
                    <div className="drawer-title-group">
                        <h2 className="drawer-title">{asset.name}</h2>
                        <code className="drawer-id">{asset.internalId}</code>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <XIcon size={24} />
                    </button>
                </div>

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
                    <button className="action-btn primary" onClick={() => onChecklist(asset)}>
                        <div className="icon-circle"><ClipboardCheckIcon size={24} color="#000" /></div>
                        <span>Checklist</span>
                    </button>
                    <button className="action-btn secondary" onClick={() => onHistory(asset)}>
                        <div className="icon-circle"><HistoryIcon size={24} color="var(--text-primary)" /></div>
                        <span>Historial</span>
                    </button>
                    <button className="action-btn secondary" onClick={() => onEdit(asset)}>
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
            </div>
        </div>
    );
};
