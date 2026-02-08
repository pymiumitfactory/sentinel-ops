import React from 'react';

interface ChartProps {
    data: number[];
    label: string;
    color?: string;
}

export const TrendChart: React.FC<ChartProps> = ({ data, label, color = '#1f6feb' }) => {
    const max = Math.max(...data, 1);
    const width = 300;
    const height = 100;
    const padding = 10;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((val / max) * (height - 2 * padding) + padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="card" style={{ padding: '1rem' }}>
            <p style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>{label}</p>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Grid lines */}
                <line x1="0" y1={height} x2={width} y2={height} stroke="#30363d" strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2={height} stroke="#30363d" strokeWidth="1" />

                {/* Trend line */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
                />

                {/* Area fill */}
                <polyline
                    fill={`${color}11`}
                    points={`${padding},${height} ${points} ${width - padding},${height}`}
                />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#8b949e' }}>
                <span>Hace 7 días</span>
                <span>Hoy</span>
            </div>
        </div>
    );
};
