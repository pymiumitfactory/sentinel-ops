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

        // Calculate percentages for donut
        const pActive = total ? (active / total) * 100 : 0;
        const pMaint = total ? (maintenance / total) * 100 : 0;

        // Critical alerts count
        const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.isResolved).length;

        return { total, active, maintenance, offline, pActive, pMaint, criticalAlerts };
    }, [assets, alerts]);

    return (
        <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>

            {/* Card 1: Fleet Health (Donut Chart) */}
            <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: `conic-gradient(
                            var(--status-ok) 0% ${stats.pActive}%, 
                            var(--safety-yellow) ${stats.pActive}% ${stats.pActive + stats.pMaint}%,
                            #555 ${stats.pActive + stats.pMaint}% 100%
                        )`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ width: '80%', height: '80%', background: '#161b22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Estado de Flota</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-ok)' }}></span>
                            {stats.active} Activos
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--safety-yellow)' }}></span>
                            {stats.maintenance} Mantenimiento
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#555' }}></span>
                            {stats.offline} Inactivos
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Critical Alerts & Efficiency (Combined for Compactness) */}
            <div className="card" style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: '0', fontSize: '1rem' }}>Riesgo Operativo</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alertas críticas pendientes</p>
                    </div>
                    <div style={{
                        background: stats.criticalAlerts > 0 ? 'rgba(248, 81, 73, 0.2)' : 'rgba(56, 139, 253, 0.1)',
                        color: stats.criticalAlerts > 0 ? '#f85149' : '#58a6ff',
                        padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold'
                    }}>
                        {stats.criticalAlerts}
                    </div>
                </div>

                {/* Progress Bar Mockup for Daily Compliance */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>Cumplimiento Diario</span>
                        <span style={{ color: 'var(--status-ok)' }}>85%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#30363d', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', background: 'var(--primary-color)' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
