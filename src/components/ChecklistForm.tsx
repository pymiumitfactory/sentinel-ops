import React, { useState, useEffect } from 'react';
import type { Asset, ChecklistItem } from '../types';
import { api } from '../api/service';
// Ensure these icons are exported in Icons.tsx. If not, we fall back to text.
import { XIcon, MapPinIcon } from './Icons';

// Local component for Camera Icon to avoid import issues if not in Icons.tsx yet
const CameraIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

interface ChecklistFormProps {
    asset: Asset;
    onClose: () => void;
    onSuccess: () => void;
}

const ITEMS: ChecklistItem[] = [
    { id: 'oil_level', label: 'Nivel de Aceite Motor', type: 'boolean' },
    { id: 'coolant_level', label: 'Nivel de Refrigerante', type: 'boolean' },
    { id: 'tire_pressure', label: 'Presión de Neumáticos / Orugas', type: 'ok_fail' },
    { id: 'leaks', label: 'Fugas Visibles (Hidráulico/Motor)', type: 'ok_fail' },
    { id: 'lights', label: 'Luces y Alarma de Retroceso', type: 'ok_fail' },
    { id: 'fuel_level', label: 'Nivel de Combustible (%)', type: 'number' },
    { id: 'horometer', label: 'Horómetro Actual', type: 'number' },
];

export const ChecklistForm: React.FC<ChecklistFormProps> = ({ asset, onClose, onSuccess }) => {
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationError, setLocationError] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get GPS on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    console.warn(err);
                    setLocationError('GPS no disponible');
                },
                { enableHighAccuracy: true, timeout: 10000 } // 10s timeout
            );
        } else {
            setLocationError('Navegador sin soporte GPS');
        }
    }, []);

    const handleChange = (id: string, value: any) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const checklistData = {
                items: responses,
                location: location,
                hasPhoto: !!photo,
                photoName: photo ? photo.name : null,
                timestamp: new Date().toISOString()
            };

            await api.createLog({
                assetId: asset.id,
                type: 'checklist',
                data: checklistData, // Store complete data JSON
                // Also pass location string if API supports it specifically
                location: location ? `${location.lat}, ${location.lng}` : undefined,
                photoFile: photo || undefined
            });

            // Update asset hours if provided
            if (responses['horometer']) {
                await api.updateAsset(asset.id, { currentHours: Number(responses['horometer']) });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar reporte');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Checklist Diario</h2>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{asset.name}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <XIcon size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Location Badge */}
                    <div style={{ marginBottom: '1.5rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <MapPinIcon size={18} color={location ? 'var(--status-ok)' : 'var(--text-secondary)'} />
                        <div>
                            {location ? (
                                <span style={{ color: 'var(--status-ok)', fontSize: '0.9rem' }}>
                                    GPS Activo: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </span>
                            ) : (
                                <span style={{ color: 'var(--safety-orange)', fontSize: '0.9rem' }}>
                                    {locationError || 'Obteniendo ubicación...'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {ITEMS.map(item => (
                            <div key={item.id} className="checklist-item" style={{ borderBottom: '1px solid #2a2417', paddingBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.85rem', color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.label}
                                </label>

                                {item.type === 'boolean' || item.type === 'ok_fail' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(item.id, 'pass')}
                                                style={{
                                                    padding: '0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                                    background: responses[item.id] === 'pass' ? '#059669' : '#161b22',
                                                    color: responses[item.id] === 'pass' ? 'white' : '#8b949e',
                                                    border: responses[item.id] === 'pass' ? 'none' : '1px solid #453b26',
                                                    textTransform: 'uppercase'
                                                }}
                                            >PASS</button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(item.id, 'fail')}
                                                style={{
                                                    padding: '0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                                    background: responses[item.id] === 'fail' ? '#dc2626' : '#161b22',
                                                    color: responses[item.id] === 'fail' ? 'white' : '#8b949e',
                                                    border: responses[item.id] === 'fail' ? 'none' : '1px solid #453b26',
                                                    textTransform: 'uppercase'
                                                }}
                                            >FAIL</button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(item.id, 'na')}
                                                style={{
                                                    padding: '0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                                    background: responses[item.id] === 'na' ? '#4b5563' : '#161b22',
                                                    color: responses[item.id] === 'na' ? 'white' : '#8b949e',
                                                    border: responses[item.id] === 'na' ? 'none' : '1px solid #453b26',
                                                    textTransform: 'uppercase'
                                                }}
                                            >N/A</button>
                                        </div>

                                        {/* Auto-expand comment field on Fail */}
                                        {responses[item.id] === 'fail' && (
                                            <textarea
                                                placeholder="Describe the issue..."
                                                style={{
                                                    width: '100%', background: '#0d1117', border: '1px solid #dc2626',
                                                    borderRadius: '4px', padding: '0.75rem', color: 'white', fontSize: '0.85rem',
                                                    minHeight: '80px', outline: 'none'
                                                }}
                                                onChange={(e) => handleChange(`${item.id}_comment`, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ) : item.type === 'number' && (
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            style={{
                                                padding: '1rem', background: '#0d1117', border: '1px solid #453b26',
                                                color: 'white', borderRadius: '4px', width: '100%', fontSize: '1.2rem', fontWeight: 700,
                                                outline: 'none'
                                            }}
                                            onChange={(e) => handleChange(item.id, e.target.value)}
                                            placeholder="0.0"
                                            step="0.1"
                                        />
                                        <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b5d3a', fontWeight: 700 }}>
                                            {item.id === 'fuel_level' ? '%' : 'HRS'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Camera Button */}
                    <div style={{ marginTop: '2rem' }}>
                        <label
                            className="camera-btn"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                padding: '1rem', border: '2px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                                background: photo ? 'rgba(46, 160, 67, 0.1)' : 'transparent',
                                color: photo ? 'var(--status-ok)' : 'var(--text-secondary)'
                            }}
                        >
                            <CameraIcon />
                            <span>{photo ? `Foto Adjunta: ${photo.name}` : 'Tomar Foto de Evidencia'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={handlePhotoChange}
                            />
                        </label>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                backgroundColor: 'var(--status-ok)', color: 'white', border: 'none',
                                padding: '0.8rem 2rem', borderRadius: '6px', fontWeight: 600,
                                opacity: isSubmitting ? 0.7 : 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? 'Enviando...' : 'Guardar Reporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
