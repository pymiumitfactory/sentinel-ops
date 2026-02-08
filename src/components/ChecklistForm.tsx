import React, { useState } from 'react';
import type { Asset } from '../types';
import { db } from '../api/offline_db';
import type { OfflineLog } from '../types/mobile_checklist';

interface ChecklistFormProps {
    asset: Asset;
    onClose: () => void;
    onSuccess: () => void;
}

export const ChecklistForm: React.FC<ChecklistFormProps> = ({ asset, onClose, onSuccess }) => {
    const [hours, setHours] = useState(asset.currentHours);
    const [answers, setAnswers] = useState({
        oilLevel: 'ok',
        noises: 'no',
        leaks: 'no',
        performance: 'normal'
    });
    const [photo, setPhoto] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Create offline record logic
        const log: OfflineLog = {
            id: crypto.randomUUID(),
            assetId: asset.id,
            // operatorId: undefined, // MVP: No auth yet
            hoursReading: hours,
            answers: [
                { questionId: 'oil', value: answers.oilLevel, severity: answers.oilLevel === 'critical' ? 'critical' : 'ok' },
                { questionId: 'noises', value: answers.noises, severity: answers.noises === 'yes' ? 'warning' : 'ok' },
                { questionId: 'leaks', value: answers.leaks, severity: answers.leaks === 'major' ? 'critical' : 'ok' }
            ],
            synced: false,
            createdAt: Date.now()
        };

        // For MVP we just console log the photo, but here we would convert to blob for IndexedDB
        if (photo) {
            console.log('Photo captured:', photo.name);
        }
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
                data: checklistData,
                location: location ? `${location.lat}, ${location.lng}` : undefined
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
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {ITEMS.map(item => (
                            <div key={item.id} className="checklist-item">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{item.label}</label>

                                {item.type === 'boolean' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${responses[item.id] === true ? 'active-ok' : ''}`}
                                            onClick={() => handleChange(item.id, true)}
                                        >OK</button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${responses[item.id] === false ? 'active-ko' : ''}`}
                                            onClick={() => handleChange(item.id, false)}
                                        >Fallo</button>
                                    </div>
                                )}

                                {item.type === 'ok_fail' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${responses[item.id] === 'ok' ? 'active-ok' : ''}`}
                                            onClick={() => handleChange(item.id, 'ok')}
                                        >✓ Bien</button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${responses[item.id] === 'fail' ? 'active-ko' : ''}`}
                                            onClick={() => handleChange(item.id, 'fail')}
                                        >⚠ Mal</button>
                                    </div>
                                )}

                                {item.type === 'number' && (
                                    <input
                                        type="number"
                                        style={{ padding: '0.8rem', background: '#0d1117', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', width: '100%' }}
                                        onChange={(e) => handleChange(item.id, e.target.value)}
                                        placeholder="0.0"
                                    />
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
                        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>Cancelar</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                backgroundColor: 'var(--status-ok)', color: 'white', border: 'none',
                                padding: '0.8rem 2rem', borderRadius: '6px', fontWeight: 600,
                                opacity: isSubmitting ? 0.7 : 1
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
