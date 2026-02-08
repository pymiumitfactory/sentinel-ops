import React, { useEffect, useState } from 'react';
import { api } from '../api/service';
import type { Asset, MaintenanceLog } from '../types';

interface AssetHistoryProps {
    asset: Asset;
    onClose: () => void;
}

export const AssetHistory: React.FC<AssetHistoryProps> = ({ asset, onClose }) => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await api.getAssetLogs(asset.id);
            setLogs(data);
            setLoading(false);
        };
        fetchHistory();
    }, [asset.id]);

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Historial: {asset.name}</h2>
                        <span style={{ fontSize: '0.9rem', color: '#8b949e' }}>{asset.internalId}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>Cargando historial...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
                        No hay reportes registrados para este activo.
                    </div>
                ) : (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {logs.map(log => {
                            const date = new Date(log.createdAt).toLocaleString();
                            const criticalIssues = Array.isArray(log.answers)
                                ? log.answers.filter((a: any) => a.severity === 'critical')
                                : [];
                            const warnings = Array.isArray(log.answers)
                                ? log.answers.filter((a: any) => a.severity === 'warning')
                                : [];

                            return (
                                <div key={log.id} style={{
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    backgroundColor: '#161b22',
                                    borderLeft: criticalIssues.length > 0 ? '4px solid #f85149' : warnings.length > 0 ? '4px solid #d29922' : '4px solid #238636'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#8b949e' }}>{date}</span>
                                        <span style={{ fontSize: '0.9rem' }}>Horómetro: <strong>{log.hoursReading} h</strong></span>
                                    </div>

                                    {/* Issues Summary */}
                                    {criticalIssues.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong style={{ color: '#f85149', fontSize: '0.9rem' }}>⚠️ Crítico:</strong>
                                            <ul style={{ margin: '0.2rem 0', paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                                                {criticalIssues.map((issue: any, idx: number) => (
                                                    <li key={idx} style={{ color: '#ff7b72' }}>
                                                        {issue.questionId}: {issue.value}
                                                        {issue.notes && <span style={{ color: '#8b949e' }}> ({issue.notes})</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {warnings.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong style={{ color: '#d29922', fontSize: '0.9rem' }}>⚠️ Advertencia:</strong>
                                            <ul style={{ margin: '0.2rem 0', paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                                                {warnings.map((issue: any, idx: number) => (
                                                    <li key={idx} style={{ color: '#f1e05a' }}>
                                                        {issue.questionId}: {issue.value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Show OK check if clean */}
                                    {criticalIssues.length === 0 && warnings.length === 0 && (
                                        <div style={{ color: '#238636', fontSize: '0.9rem' }}>✅ Inspección sin novedades</div>
                                    )}

                                    {/* Raw Answers Expander (Optional, kept simple for MVP) */}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
