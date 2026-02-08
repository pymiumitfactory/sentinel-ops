import React from 'react';
import type { Alert, Asset } from '../types';
import { AlertTriangleIcon, CheckIcon, XIcon } from './Icons';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: Alert[];
    assets: Asset[]; // Needed to show asset names
    onResolve: (id: string) => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    isOpen, onClose, alerts, assets, onResolve
}) => {
    if (!isOpen) return null;

    // Filter only unresolved alerts
    const activeAlerts = alerts.filter(a => !a.isResolved);

    return (
        <div className="notification-overlay" onClick={onClose}>
            <div className="notification-panel" onClick={e => e.stopPropagation()}>
                <div className="panel-header">
                    <h3>Notificaciones ({activeAlerts.length})</h3>
                    <button onClick={onClose} className="close-btn"><XIcon size={24} /></button>
                </div>

                <div className="panel-content">
                    {activeAlerts.length === 0 ? (
                        <div className="empty-state">
                            <CheckIcon size={48} color="var(--status-ok)" />
                            <p>Todo en orden. No hay alertas pendientes.</p>
                        </div>
                    ) : (
                        <ul className="alert-list">
                            {activeAlerts.map(alert => {
                                const assetName = assets.find(a => a.id === alert.assetId)?.name || 'Desconocido';
                                return (
                                    <li key={alert.id} className={`alert-item severity-${alert.severity}`}>
                                        <div className="alert-icon">
                                            <AlertTriangleIcon size={20} color={alert.severity === 'high' ? 'var(--status-down)' : 'var(--safety-orange)'} />
                                        </div>
                                        <div className="alert-info">
                                            <h4>{assetName}</h4>
                                            <p>{alert.description}</p>
                                            <span className="alert-time">{new Date(alert.createdAt).toLocaleString()}</span>
                                        </div>
                                        <button
                                            className="resolve-btn"
                                            onClick={() => onResolve(alert.id)}
                                            title="Marcar como resuelto"
                                        >
                                            <CheckIcon size={18} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
