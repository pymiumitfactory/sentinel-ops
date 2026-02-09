import React, { useMemo } from 'react';
import type { Asset, Alert } from '../types';

interface DashboardStatsProps {
    assets: Asset[];
    alerts: Alert[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ assets, alerts }) => {

    const stats = useMemo(() => {
        const total = assets.length;
        const maintenance = assets.filter(a => a.status === 'maintenance').length;
        const active = assets.filter(a => a.status === 'active').length;
        const offline = assets.filter(a => a.status === 'offline').length;

        const pActive = total ? (active / total) * 100 : 0;
        const pMaint = total ? (maintenance / total) * 100 : 0;

        const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.isResolved);

        return { total, active, maintenance, offline, pActive, pMaint, criticalAlerts };
    }, [assets, alerts]);

    return (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>

            {/* Card 1: Fleet Health (Donut) */}
            <div className="card" style={{
                background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fleet Health</h3>
                    <span className="material-icon" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>activity_zone</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="donut-chart-container" style={{ position: 'relative', width: 80, height: 80 }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="16" fill="none" stroke="#38301f" strokeWidth="4" />
                            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--status-ok)" strokeWidth="4"
                                strokeDasharray={`${stats.pActive}, 100`} />
                            {stats.pMaint > 0 && (
                                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--safety-yellow)" strokeWidth="4"
                                    strokeDasharray={`${stats.pMaint}, 100`} strokeDashoffset={`-${stats.pActive}`} />
                            )}
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                            {Math.round(stats.pActive)}%
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-ok)' }}></span>
                            <span style={{ color: 'white' }}>Operational</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--safety-yellow)' }}></span>
                            <span style={{ color: 'white' }}>Maintenance</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Critical Alerts */}
            {stats.criticalAlerts.length > 0 ? (
                <div className="card" style={{
                    background: 'rgba(127, 29, 29, 0.2)',
                    borderColor: 'rgba(127, 29, 29, 0.5)',
                    padding: '1.25rem', borderRadius: '4px', border: '1px solid',
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                    <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                        <span className="material-icon" style={{ fontSize: '100px', color: '#dc2626' }}>warning</span>
                    </div>
                    <div style={{ position: 'relative', zIndex: 10, marginBottom: '0.8rem' }}>
                        <h3 style={{
                            margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#f87171',
                            textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span className="animate-pulse" style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></span>
                            Critical Alert
                        </h3>
                    </div>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <p style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
                            {stats.criticalAlerts[0].description}
                        </p>
                        <p style={{ margin: '4px 0 12px', color: '#fecaca', fontSize: '0.75rem' }}>
                            Sector 7G • Immediate Attention Required
                        </p>
                        <button style={{
                            width: '100%', padding: '0.6rem',
                            background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px',
                            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}>
                            Deploy Tech
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card" style={{
                    background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                    <span className="material-icon" style={{ fontSize: '32px', color: 'var(--status-ok)', marginBottom: '0.5rem' }}>check_circle</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>All Systems Nominal</span>
                </div>
            )}

            {/* Card 3: Active Assets */}
            <div className="card" style={{
                background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Assets</h3>
                    <span className="material-icon" style={{ fontSize: '18px', color: 'var(--safety-yellow)' }}>precision_manufacturing</span>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.8rem' }}>
                        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white' }}>{stats.active}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ {stats.total} Total</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#38301f', borderRadius: '3px', marginTop: '0.8rem', overflow: 'hidden' }}>
                        <div style={{ width: `${stats.pActive}%`, height: '100%', background: 'var(--safety-yellow)' }}></div>
                    </div>
                </div>
            </div>

            {/* Card 4: Est. Range */}
            <div className="card" style={{
                background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Range</h3>
                    <span className="material-icon" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>local_gas_station</span>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.8rem' }}>
                        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white' }}>420</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hours</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.7rem', color: '#10B981' }}>
                        <span className="material-icon" style={{ fontSize: '14px' }}>trending_up</span>
                        <span>+4% vs last week</span>
                    </div>
                </div>
            </div>

        </div>
    );
};
