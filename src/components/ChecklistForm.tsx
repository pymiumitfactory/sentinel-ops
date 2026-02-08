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

        try {
            await db.logs.add(log);
            console.log('Log saved to offline DB:', log);
        } catch (error) {
            console.error('Failed to save offline log:', error);
            alert('Error al guardar en base de datos local');
            setSubmitting(false);
            return;
        }

        setSubmitting(false);
        onSuccess();
        onClose();
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', border: '1px solid #1f6feb' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Checklist: {asset.name}</h2>
                <form className="checklist-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Lectura de Horómetro ({asset.currentHours}h actuales)</label>
                        <input
                            type="number"
                            value={hours}
                            onChange={e => setHours(Number(e.target.value))}
                            min={asset.currentHours}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>¿Nivel de aceite motor?</label>
                        <select value={answers.oilLevel} onChange={e => setAnswers({ ...answers, oilLevel: e.target.value })}>
                            <option value="ok">Óptimo (Check)</option>
                            <option value="low">Bajo (Requiere relleno)</option>
                            <option value="critical">Crítico (Parar máquina)</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>¿Ruidos inusuales en motor/hidráulicos?</label>
                        <select value={answers.noises} onChange={e => setAnswers({ ...answers, noises: e.target.value })}>
                            <option value="no">No detectados</option>
                            <option value="yes">Sí detectados (Reportar)</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>¿Fugas visibles de fluidos?</label>
                        <select value={answers.leaks} onChange={e => setAnswers({ ...answers, leaks: e.target.value })}>
                            <option value="no">Ninguna</option>
                            <option value="minor">Fuga menor (Sudar)</option>
                            <option value="major">Goteo/Fuga mayor</option>
                        </select>
                    </div>

                    <div className="input-group" style={{ marginTop: '0.5rem', border: '1px dashed #30363d', padding: '1rem', borderRadius: '6px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#58a6ff', cursor: 'pointer' }}>
                            📷 Agregar Evidencia (Foto)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhoto}
                            style={{ fontSize: '0.8rem' }}
                        />
                        {photo && <small style={{ display: 'block', marginTop: '0.5rem', color: '#3fb950' }}>✓ {photo.name}</small>}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Guardando...' : 'Guardar y Sincronizar'}
                        </button>
                        <button type="button" onClick={onClose} style={{ backgroundColor: '#21262d', border: '1px solid #30363d' }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
