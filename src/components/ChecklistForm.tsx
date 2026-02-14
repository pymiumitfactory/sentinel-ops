import React, { useState, useEffect } from 'react';
import type { Asset, ChecklistItem } from '../types';
import { api } from '../api/service';
import { XIcon, MapPinIcon } from './Icons';

// Local icons
const CameraIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

const HistoryIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6"></path>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
    </svg>
);

interface ChecklistFormProps {
    asset: Asset;
    onClose: () => void;
    onSuccess: () => void;
}

const ITEMS: ChecklistItem[] = [
    { id: 'safety_guards', label: 'Safety Guards', type: 'ok_fail' },
    { id: 'oil_level', label: 'Engine Oil Level', type: 'boolean' },
    { id: 'coolant_level', label: 'Coolant Level', type: 'boolean' },
    { id: 'hydraulic_fluid', label: 'Hydraulic Fluid Levels', type: 'ok_fail' },
    { id: 'tire_pressure', label: 'Tires / Tracks Condition', type: 'ok_fail' },
    { id: 'leaks', label: 'External Leaks (Hyd/Eng)', type: 'ok_fail' },
    { id: 'lights', label: 'Safety Lights & Alarms', type: 'ok_fail' },
    { id: 'fuel_level', label: 'Fuel Reserved (%)', type: 'number' },
    { id: 'horometer', label: 'Current Horometer', type: 'number' },
];

export const ChecklistForm: React.FC<ChecklistFormProps> = ({ asset, onClose, onSuccess }) => {
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [photos, setPhotos] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signatureConfirm, setSignatureConfirm] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                null,
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const handleChange = (id: string, value: any) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotos(prev => [...prev, e.target.files![0]]);
        }
    };

    const handleSubmit = async (isDraft = false) => {
        if (!isDraft && !signatureConfirm) {
            alert('Please certify the inspection with the technician signature/checkbox.');
            return;
        }

        setIsSubmitting(true);
        try {
            const checklistData = {
                items: responses,
                location,
                photoCount: photos.length,
                isDraft,
                timestamp: new Date().toISOString()
            };

            await api.createLog({
                assetId: asset.id,
                type: isDraft ? 'draft_inspection' : 'inspection',
                data: checklistData,
                location: location ? `${location.lat}, ${location.lng}` : undefined,
                photoFile: photos[0] // API currently accepts one, but we allow UI multiple
            });

            if (!isDraft && responses['horometer']) {
                await api.updateAsset(asset.id, { currentHours: Number(responses['horometer']) });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failure transmitting report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const completedCount = Object.keys(responses).filter(k => !k.includes('_comment')).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: '#211c12', minHeight: '100%' }}>
            {/* Header Content */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #453b26' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: '#d39b22', display: 'flex' }}>
                            <span className="material-icon" style={{ fontSize: '32px' }}>build_circle</span>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>FieldOps Pro</h2>
                            <p style={{ margin: 0, color: '#c5b696', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="status-pulse" style={{ width: '6px', height: '6px', background: '#d39b22', borderRadius: '50%' }}></span>
                                INSPECTION PROTOCOL ACTIVE
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#2a2418', border: '1px solid #453b26', color: '#c5b696', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                        <XIcon size={20} />
                    </button>
                </div>

                {/* Asset ID Card */}
                <div style={{
                    background: '#2a2418', border: '1px solid #453b26', borderRadius: '4px',
                    padding: '1rem', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#d39b22' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ background: '#453b26', color: '#c5b696', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px' }}>ID: {asset.internalId}</span>
                                <span style={{ background: 'rgba(211,155,34,0.1)', color: '#d39b22', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '2px' }}>IN PROGRESS</span>
                            </div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 900 }}>{asset.name}</h3>
                            <p style={{ margin: '2px 0 0', color: '#c5b696', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPinIcon size={12} /> {asset.location || 'Site Sector Alpha'}
                            </p>
                        </div>
                        <button style={{ background: 'transparent', border: '1px solid #453b26', color: 'white', padding: '6px 12px', fontSize: '10px', fontWeight: 800, borderRadius: '4px', cursor: 'pointer' }}>
                            HISTORY
                        </button>
                    </div>
                </div>
            </div>

            {/* Checklist Items */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icon" style={{ color: '#d39b22', fontSize: '20px' }}>playlist_add_check</span>
                        Inspection Items
                    </h4>
                    <span style={{ color: '#c5b696', fontSize: '0.75rem', fontWeight: 600 }}>{completedCount} of {ITEMS.length} Completed</span>
                </div>

                {ITEMS.map((item, index) => {
                    const isFailed = responses[item.id] === 'fail';
                    return (
                        <div key={item.id} style={{
                            background: '#2a2418', border: isFailed ? '1px solid #ef4444' : '1px solid #453b26',
                            borderRadius: '4px', padding: '1.25rem', position: 'relative'
                        }}>
                            {isFailed && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#ef4444' }}></div>}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', background: '#211c12', border: '1px solid #453b26',
                                        borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#c5b696', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0
                                    }}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h5 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 800 }}>{item.label}</h5>
                                        <p style={{ margin: '4px 0 0', color: '#c5b696', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                            {item.type === 'number' ? 'Provide current reading for telemetry sync.' : 'Visual inspection for integrity and operational safety.'}
                                        </p>
                                    </div>
                                </div>

                                {item.type !== 'number' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(item.id, 'pass')}
                                                style={{
                                                    height: '48px', background: responses[item.id] === 'pass' ? '#10B981' : '#1a160e',
                                                    color: responses[item.id] === 'pass' ? '#000' : '#8b949e',
                                                    border: '1px solid #453b26', borderRadius: '4px', fontWeight: 900,
                                                    textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '10px', gap: '2px'
                                                }}
                                            >
                                                <span className="material-icon" style={{ fontSize: '16px' }}>check_circle</span>
                                                PASS
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(item.id, 'fail')}
                                                style={{
                                                    height: '48px', background: responses[item.id] === 'fail' ? '#ef4444' : '#1a160e',
                                                    color: responses[item.id] === 'fail' ? 'white' : '#8b949e',
                                                    border: '1px solid #453b26', borderRadius: '4px', fontWeight: 900,
                                                    textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '10px', gap: '2px',
                                                    boxShadow: responses[item.id] === 'fail' ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
                                                }}
                                            >
                                                <span className="material-icon" style={{ fontSize: '16px' }}>error</span>
                                                FAIL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(item.id, 'na')}
                                                style={{
                                                    height: '48px', background: responses[item.id] === 'na' ? '#4b5563' : '#1a160e',
                                                    color: responses[item.id] === 'na' ? 'white' : '#8b949e',
                                                    border: '1px solid #453b26', borderRadius: '4px', fontWeight: 900,
                                                    textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '10px', gap: '2px'
                                                }}
                                            >
                                                <span className="material-icon" style={{ fontSize: '16px' }}>remove_circle</span>
                                                N/A
                                            </button>
                                        </div>

                                        {isFailed && (
                                            <div style={{ background: '#211c12', borderRadius: '4px', padding: '12px', border: '1px solid #453b26' }}>
                                                <label style={{ color: '#ef4444', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Issue Description (Required)</label>
                                                <textarea
                                                    required
                                                    placeholder="Describe the critical finding..."
                                                    style={{
                                                        width: '100%', background: '#1a160e', border: '1px solid #453b26',
                                                        borderRadius: '4px', padding: '10px', color: 'white', fontSize: '0.85rem',
                                                        minHeight: '80px', outline: 'none', resize: 'vertical'
                                                    }}
                                                    value={responses[`${item.id}_comment`] || ''}
                                                    onChange={(e) => handleChange(`${item.id}_comment`, e.target.value)}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                                    <button type="button" style={{ background: 'transparent', border: 'none', color: '#c5b696', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <span className="material-icon" style={{ fontSize: '14px' }}>mic</span> Dictar
                                                    </button>
                                                    <button type="button" onClick={() => document.getElementById(`photo-${item.id}`)?.click()} style={{ background: '#2a2418', border: '1px solid #453b26', color: 'white', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <CameraIcon size={14} /> Add Photo
                                                        <input id={`photo-${item.id}`} type="file" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            required
                                            style={{
                                                width: '100%', background: '#1a160e', border: '1px solid #453b26',
                                                borderRadius: '4px', padding: '12px', color: 'white', fontSize: '1.25rem',
                                                fontWeight: 900, outline: 'none'
                                            }}
                                            placeholder="0.0"
                                            onChange={(e) => handleChange(item.id, e.target.value)}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d39b22', fontWeight: 900, fontSize: '0.9rem' }}>
                                            {item.id === 'fuel_level' ? '%' : 'HRS'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Evidence Section */}
                <div style={{ background: '#2a2418', border: '1px solid #453b26', borderRadius: '4px', padding: '1.25rem' }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <span className="material-icon" style={{ color: '#d39b22', fontSize: '20px' }}>photo_camera</span>
                        Photographic Evidence
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                        <button
                            type="button"
                            onClick={() => document.getElementById('main-photo')?.click()}
                            style={{
                                width: '100px', height: '100px', background: '#1a160e', border: '2px dashed #453b26',
                                borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', gap: '8px', color: '#c5b696', cursor: 'pointer', flexShrink: 0
                            }}
                        >
                            <span className="material-icon" style={{ fontSize: '24px' }}>add_a_photo</span>
                            <span style={{ fontSize: '10px', fontWeight: 800 }}>ADD PHOTO</span>
                            <input id="main-photo" type="file" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
                        </button>

                        {photos.map((p, i) => (
                            <div key={i} style={{ width: '100px', height: '100px', background: '#1a160e', border: '1px solid #453b26', borderRadius: '4px', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                                <img src={URL.createObjectURL(p)} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ef4444', borderRadius: '2px', cursor: 'pointer' }}>
                                    <XIcon size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signature Section */}
                <div style={{ background: '#2a2418', border: '1px solid #453b26', borderRadius: '4px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icon" style={{ color: '#d39b22', fontSize: '20px' }}>draw</span>
                            Technician Signature
                        </h4>
                        <button type="button" style={{ background: 'transparent', border: 'none', color: '#c5b696', fontSize: '10px', textDecoration: 'underline', cursor: 'pointer' }}>Clear</button>
                    </div>
                    <div style={{
                        width: '100%', height: '120px', background: 'white', borderRadius: '4px',
                        border: '2px dashed #c5b696', position: 'relative', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', fontWeight: 700, pointerEvents: 'none' }}>SIGNATURE AREA ACTIVE</span>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                            <path d="M 30 80 Q 50 40 80 70 T 150 60 T 200 85" fill="none" stroke="black" strokeWidth="2" />
                        </svg>
                    </div>
                    <label style={{ display: 'flex', gap: '10px', marginTop: '1rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={signatureConfirm}
                            onChange={(e) => setSignatureConfirm(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#d39b22' }}
                        />
                        <span style={{ color: '#c5b696', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            I certify that this inspection was performed according to safety standards and reflects the real state of the asset.
                        </span>
                    </label>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div style={{
                position: 'sticky', bottom: 0, left: 0, right: 0, padding: '1.25rem',
                background: '#1a160e', borderTop: '1px solid #453b26', zIndex: 100,
                display: 'flex', gap: '1rem', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
            }}>
                <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    style={{
                        flex: 1, height: '48px', background: 'transparent', border: '1px solid #453b26',
                        color: 'white', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer'
                    }}
                >
                    Save Draft
                </button>
                <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ flex: 2, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {isSubmitting ? 'Transmitting...' : (
                        <>
                            <span className="material-icon">send</span>
                            Finalizar Reporte
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
