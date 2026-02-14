import React, { useEffect, useState } from 'react';
import { api } from '../api/service';
import type { Asset, MaintenanceLog } from '../types';

interface AssetHistoryProps {
    asset: Asset;
    onViewLog: (log: MaintenanceLog) => void;
}

export const AssetHistory: React.FC<AssetHistoryProps> = ({ asset, onViewLog }) => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'alerts' | 'photos'>('all');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.getAssetLogs(asset.id);
                setLogs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } catch (err) {
                console.error("History fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [asset.id]);

    const getStatusTheme = (log: MaintenanceLog) => {
        const logData = log.answers || {};
        const items = logData.items || logData;
        const hasFailures = Object.values(items).some(v => v === 'fail' || v === 'critical');

        if (hasFailures) return { color: '#ef4444', icon: 'priority_high', label: 'CRITICAL', bg: 'rgba(153, 27, 27, 0.3)', border: '#7f1d1d' };
        return { color: '#10B981', icon: 'check', label: 'PASSED', bg: 'rgba(6, 78, 59, 0.3)', border: '#064e3b' };
    };

    const filteredLogs = logs.filter(log => {
        const items = log.answers?.items || log.answers || {};
        if (filter === 'alerts') {
            return Object.values(items).some(v => v === 'fail' || v === 'critical');
        }
        if (filter === 'photos') return !!log.photoUrl;
        return true;
    });

    return (
        <div style={{ padding: '0 1.5rem 2rem', background: '#121212', minHeight: '100%', color: 'white' }}>
            {/* Design Filters Toolbar */}
            <div style={{
                display: 'flex', gap: '8px', margin: '0', padding: '1.5rem 0', overflowX: 'auto',
                borderBottom: '1px solid #333'
            }} className="rugged-scroll">
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: filter === 'all' ? '#d39b22' : 'transparent',
                        color: filter === 'all' ? '#000' : '#9ca3af',
                        border: `1px solid ${filter === 'all' ? '#d39b22' : '#333'}`,
                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase'
                    }}
                >
                    <span className="material-icon" style={{ fontSize: '16px' }}>view_list</span>
                    Todos
                </button>
                <button
                    onClick={() => setFilter('alerts')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: filter === 'alerts' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        color: filter === 'alerts' ? '#ef4444' : '#9ca3af',
                        border: `1px solid ${filter === 'alerts' ? '#ef4444' : '#333'}`,
                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase'
                    }}
                >
                    <span className="material-icon" style={{ fontSize: '16px' }}>warning</span>
                    Alertas
                </button>
                <button
                    onClick={() => setFilter('photos')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: filter === 'photos' ? 'rgba(211, 155, 34, 0.1)' : 'transparent',
                        color: filter === 'photos' ? '#d39b22' : '#9ca3af',
                        border: `1px solid ${filter === 'photos' ? '#d39b22' : '#333'}`,
                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase'
                    }}
                >
                    <span className="material-icon" style={{ fontSize: '16px' }}>photo_camera</span>
                    Con Fotos
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
                    <span className="material-icon animate-spin" style={{ fontSize: '32px' }}>sync</span>
                    <p style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', marginTop: '1rem' }}>Sincronizando Dossier...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div style={{ padding: '5rem 2rem', textAlign: 'center', border: '1px dashed #333', borderRadius: '8px', marginTop: '2rem' }}>
                    <span className="material-icon" style={{ fontSize: '48px', color: '#333', marginBottom: '1rem' }}>inventory_2</span>
                    <p style={{ color: '#666', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>No se encontraron registros</p>
                </div>
            ) : (
                <div style={{
                    position: 'relative', paddingLeft: '2rem', marginTop: '2rem',
                    borderLeft: '2px solid #333'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {filteredLogs.map((log) => {
                            const theme = getStatusTheme(log);
                            const date = new Date(log.createdAt);
                            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                            const logIdShort = log.id.substring(0, 8).toUpperCase();

                            return (
                                <div key={log.id} style={{ position: 'relative' }}>
                                    {/* Design Marker */}
                                    <div style={{
                                        position: 'absolute', left: '-2.55rem', top: '0',
                                        width: '2rem', height: '2rem', borderRadius: '50%',
                                        background: '#121212', border: `2px solid ${theme.color}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                                        boxShadow: `0 0 12px ${theme.color}40`,
                                        marginTop: '4px'
                                    }}>
                                        <span className="material-icon" style={{ fontSize: '14px', color: theme.color, fontWeight: 'bold' }}>
                                            {theme.icon}
                                        </span>
                                    </div>

                                    {/* Design Card */}
                                    <div style={{
                                        background: '#1e1e1e', border: '1px solid #333',
                                        borderRadius: '8px', padding: '1.25rem', position: 'relative',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                        borderLeft: theme.label === 'CRITICAL' ? `4px solid ${theme.color}` : '1px solid #333'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <h4 style={{ margin: 0, color: 'white', fontSize: '1.05rem', fontWeight: 800 }}>Inspección de Turno</h4>
                                                    <span style={{
                                                        background: theme.bg, color: theme.color,
                                                        border: `1px solid ${theme.border}`, padding: '1px 8px',
                                                        borderRadius: '2px', fontSize: '9px', fontWeight: 900,
                                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                                    }}>
                                                        {theme.label}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span className="material-icon" style={{ fontSize: '14px' }}>schedule</span>
                                                        {timeStr}
                                                    </span>
                                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#444' }}></span>
                                                    <span>LOG: #{logIdShort}</span>
                                                </div>
                                            </div>

                                            {/* Design Operator Badge */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                background: '#2a2a2a', padding: '4px 12px 4px 6px',
                                                borderRadius: '20px', border: '1px solid #333'
                                            }}>
                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '50%',
                                                    overflow: 'hidden', border: '1px solid #444', background: '#333'
                                                }}>
                                                    <img
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiYimeKEA_IL4wt1KYDxgOpYZhwWYcFkAw_2dHwlMzv_dR2wEWE4EjJF8LahJO4P6Jb4GO8nCx5_XBhokLlabLdHkXYsf9znbp-2bx4AlPAgFcbNEfpAOAh7MWukTDf7b7A69ABNlU-04BtvJSljHy2jAo8rZ3dHtb-dT0spjNLllKIJSA0sCwG-dzgmAukwsSqM2ukyC_QNSPV969p3iYNzXq37l7mAK6v_vIajViujEaVf0RCIrWT5U6CeBqvR_BS5mLcmzhdg"
                                                        alt="User"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <span style={{ color: 'white', fontSize: '11px', fontWeight: 600 }}>J. Doe</span>
                                            </div>
                                        </div>

                                        <p style={{
                                            margin: '0 0 1.25rem', color: '#9ca3af', fontSize: '0.85rem',
                                            lineHeight: 1.5, fontWeight: 400
                                        }}>
                                            Protocolo de mantenimiento preventivo ejecutado. Lectura de horómetro verificada en {log.hoursReading} horas.
                                            {theme.label === 'CRITICAL' ? ' Alerta generada por fallos en sistemas críticos.' : ' Todos los parámetros operacionales se encuentran dentro de los rangos establecidos.'}
                                        </p>

                                        {/* design Evidence Thumbnails */}
                                        {log.photoUrl && (
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
                                                <div style={{
                                                    width: '64px', height: '64px', borderRadius: '4px',
                                                    border: '1px solid #333', overflow: 'hidden', cursor: 'pointer'
                                                }}>
                                                    <img src={log.photoUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => onViewLog(log)}
                                            style={{
                                                width: '100%', background: 'transparent', border: '1px solid #333',
                                                color: '#d39b22', padding: '12px', borderRadius: '4px',
                                                fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                                textTransform: 'uppercase', transition: 'all 0.2s',
                                                letterSpacing: '0.05em'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#d39b22';
                                                e.currentTarget.style.color = '#000';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = '#d39b22';
                                            }}
                                        >
                                            Ver Ficha Técnica de Inspección
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
