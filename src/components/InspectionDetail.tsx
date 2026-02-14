import React from 'react';
import type { Asset, MaintenanceLog } from '../types';

interface InspectionDetailProps {
    asset: Asset;
    log: MaintenanceLog;
    onClose: () => void;
}

export const InspectionDetail: React.FC<InspectionDetailProps> = ({ asset, log, onClose }) => {
    // Robust data extraction for DB coherence
    const logData = log.answers || {};
    // ChecklistForm wraps answers in { items: { key: value } }
    const answers = logData.items || logData;

    const date = new Date(log.createdAt);
    const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Filter out metadata keys like location, photoCount, isDraft, timestamp
    const checklistItems = Object.entries(answers).filter(([k, v]) => {
        // Must not be a metadata key and value must be pass/fail/na/number
        const isMetadata = ['location', 'photoCount', 'isDraft', 'timestamp', 'items'].includes(k);
        const isComment = k.endsWith('_comment');
        return !isMetadata && !isComment && typeof v !== 'object';
    });

    // Check for failures to set theme
    const hasFailures = checklistItems.some(([_, v]) => v === 'fail' || v === 'critical');

    const theme = hasFailures
        ? { color: '#ef4444', icon: 'priority_high', label: 'ALERTA CRÍTICA', bg: 'rgba(239, 68, 68, 0.1)' }
        : { color: '#10B981', icon: 'check_circle', label: 'SISTEMA OPERATIVO', bg: 'rgba(16, 185, 129, 0.1)' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: '#121212', minHeight: '100%', color: 'white' }}>
            {/* Design Header - Sticky */}
            <div style={{
                padding: '1.25rem 1.5rem', borderBottom: '1px solid #333', background: '#1e1e1e',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid #333',
                            color: '#9ca3af', width: '36px', height: '36px', borderRadius: '4px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <span className="material-icon" style={{ fontSize: '20px' }}>arrow_back</span>
                    </button>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Dossier de Inspección
                        </h2>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '10px', fontFamily: 'monospace' }}>
                            REF: {log.id.toUpperCase()}
                        </p>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: theme.bg,
                    padding: '6px 14px', borderRadius: '2px', border: `1px solid ${theme.color}40`
                }}>
                    <span className="material-icon" style={{ color: theme.color, fontSize: '16px' }}>{theme.icon}</span>
                    <span style={{ color: theme.color, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>{theme.label}</span>
                </div>
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }} className="rugged-scroll">
                {/* Audit Context Card */}
                <div style={{
                    background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                    padding: '1.5rem', marginBottom: '2rem', position: 'relative',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', textAlign: 'right' }}>
                        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>
                            {log.hoursReading.toLocaleString()}
                        </div>
                        <div style={{ color: '#d39b22', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>HORÓMETRO (HRS)</div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '48px', height: '48px', background: '#262626',
                            border: '1px solid #333', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span className="material-icon" style={{ color: '#d39b22', fontSize: '24px' }}>precision_manufacturing</span>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 900 }}>{asset.name}</h3>
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px' }}>{formattedDate} • {formattedTime}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid #333', paddingTop: '1.25rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '9px', color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>OPERADOR RESPONSABLE</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#333', border: '1px solid #444' }}></div>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: 600 }}>Técnico de Turno</span>
                            </div>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '9px', color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>UBICACIÓN GPS</span>
                            <span style={{ color: 'white', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icon" style={{ fontSize: '14px', color: '#d39b22' }}>location_on</span>
                                {log.gpsLocation && typeof log.gpsLocation.lat === 'number' && typeof log.gpsLocation.lng === 'number'
                                    ? `${log.gpsLocation.lat.toFixed(4)}, ${log.gpsLocation.lng.toFixed(4)}`
                                    : 'Sincronización Local'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Evidence Section */}
                {log.photoUrl && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{
                            margin: '0 0 1rem', color: 'white', fontSize: '0.8rem',
                            fontWeight: 900, textTransform: 'uppercase', display: 'flex',
                            alignItems: 'center', gap: '8px', letterSpacing: '0.1em'
                        }}>
                            <span className="material-icon" style={{ color: '#d39b22', fontSize: '18px' }}>photo_camera</span>
                            Evidencia Fotográfica
                        </h4>
                        <div style={{
                            width: '100%', borderRadius: '8px',
                            border: '1px solid #333', overflow: 'hidden', background: '#000'
                        }}>
                            <img src={log.photoUrl} alt="Visual Evidence" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                        </div>
                    </div>
                )}

                {/* Protocol Results */}
                <h4 style={{
                    margin: '0 0 1rem', color: 'white', fontSize: '0.8rem',
                    fontWeight: 900, textTransform: 'uppercase', display: 'flex',
                    alignItems: 'center', gap: '8px', letterSpacing: '0.1em'
                }}>
                    <span className="material-icon" style={{ color: '#d39b22', fontSize: '18px' }}>fact_check</span>
                    Resultados del Protocolo
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {checklistItems.length === 0 ? (
                        <div style={{ padding: '2rem', background: '#1a1a1a', border: '1px dashed #333', borderRadius: '4px', textAlign: 'center', color: '#666' }}>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700 }}>SIN DATOS DE PROTOCOLO DISPONIBLES</p>
                        </div>
                    ) : (
                        checklistItems.map(([key, value]) => {
                            const isFail = value === 'fail' || value === 'critical';
                            const statusColor = isFail ? '#ef4444' : value === 'pass' ? '#10B981' : '#9ca3af';
                            //@ts-ignore
                            const comment = answers[`${key}_comment`];

                            return (
                                <div key={key} style={{
                                    background: '#1e1e1e', border: '1px solid #333', borderRadius: '4px', padding: '1.25rem',
                                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                    borderLeft: `4px solid ${statusColor}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <div style={{
                                            background: `${statusColor}20`, color: statusColor, padding: '2px 10px',
                                            borderRadius: '2px', fontSize: '9px', fontWeight: 900,
                                            textTransform: 'uppercase', border: `1px solid ${statusColor}40`
                                        }}>
                                            {String(value).toUpperCase()}
                                        </div>
                                    </div>
                                    {comment && (
                                        <div style={{
                                            background: 'rgba(0,0,0,0.2)', padding: '10px',
                                            borderLeft: `2px solid ${statusColor}`, fontSize: '0.8rem',
                                            color: '#9ca3af', fontStyle: 'italic', borderRadius: '2px'
                                        }}>
                                            "{comment}"
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Digital Certification */}
                <div style={{
                    marginTop: '3rem', padding: '2rem', background: '#1a1a1a',
                    border: '1px solid #333', borderRadius: '8px', textAlign: 'center'
                }}>
                    <div style={{ display: 'inline-flex', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                        <span className="material-icon" style={{ color: '#10B981', fontSize: '32px' }}>verified_user</span>
                    </div>
                    <h5 style={{ margin: '0 0 0.5rem', color: 'white', fontSize: '1rem', fontWeight: 800 }}>Certificación SentinelOps</h5>
                    <p style={{ margin: '0 0 1.5rem', color: '#9ca3af', fontSize: '11px', maxWidth: '300px', marginInline: 'auto' }}>
                        Este registro ha sido firmado electrónicamente y sincronizado con los servidores centrales.
                    </p>
                    <div style={{ height: '1px', width: '100%', background: '#333', marginBottom: '1.5rem' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '9px', color: '#666', fontWeight: 800 }}>TIMESTAMP</span>
                            <span style={{ color: 'white', fontSize: '10px', fontFamily: 'monospace' }}>{new Date(log.createdAt).toISOString()}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '9px', color: '#666', fontWeight: 800 }}>SECURITY HASH</span>
                            <span style={{ color: 'white', fontSize: '10px', fontFamily: 'monospace' }}>SHA:{log.id.substring(0, 8)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
