import React, { useState } from 'react';
import type { Asset } from '../types';

interface AssetFormProps {
    asset?: Asset; // If provided, we are Editing. If null, Creating.
    onClose: () => void;
    onSave: (data: Partial<Asset>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, onClose, onSave, onDelete }) => {
    const isEdit = !!asset;

    const [formData, setFormData] = useState<Partial<Asset>>({
        name: asset?.name || '',
        internalId: asset?.internalId || '',
        brand: asset?.brand || '',
        model: asset?.model || '',
        category: asset?.category || 'heavy_machinery',
        location: asset?.location || '',
    });

    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!asset || !onDelete) return;
        setLoading(true);
        try {
            await onDelete(asset.id);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                        {isEdit ? 'Editar Activo' : 'Nuevo Activo'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: '1.5rem' }}>×</button>
                </div>

                {!showDeleteConfirm ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ borderBottom: '1px solid #2a2417', paddingBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Identity</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. CAT EXCAVATOR 320"
                                style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '0.8rem', color: 'white', fontWeight: 600 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderBottom: '1px solid #2a2417', paddingBottom: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit ID</label>
                                <input name="internalId" value={formData.internalId} onChange={handleChange} required placeholder="EXC-001" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '0.8rem', color: 'white', fontFamily: 'var(--font-mono)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Location</label>
                                <input name="location" value={formData.location} onChange={handleChange} required placeholder="Sector 7G" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '0.8rem', color: 'white' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderBottom: '1px solid #2a2417', paddingBottom: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand</label>
                                <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Caterpillar" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '0.8rem', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</label>
                                <input name="model" value={formData.model} onChange={handleChange} placeholder="320 GC" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '0.8rem', color: 'white' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '0.8rem', color: 'white', cursor: 'pointer', appearance: 'none' }}
                            >
                                <option value="heavy_machinery">Heavy Machinery</option>
                                <option value="light_vehicle">Light Vehicle</option>
                                <option value="transport">Transport / Logistics</option>
                                <option value="utility">Utility / Plant</option>
                            </select>
                        </div>

                        {isEdit && (
                            <div style={{ background: 'rgba(211, 155, 34, 0.05)', padding: '1rem', borderRadius: '4px', border: '1px dashed #d29922', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#d29922', textTransform: 'uppercase' }}>System Tracking ID (QR Source):</p>
                                <code style={{ color: 'white', fontSize: '0.9rem', display: 'block', marginTop: '4px' }}>{asset.id}</code>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 2, background: 'var(--safety-yellow)', color: '#201c12', border: 'none',
                                    padding: '1rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.9rem',
                                    textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 10px rgba(211, 155, 34, 0.2)'
                                }}
                            >
                                {loading ? 'Processing...' : (isEdit ? 'Update Asset' : 'Commission Asset')}
                            </button>

                            {isEdit && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        flex: 1, background: 'transparent', border: '1px solid #dc2626', color: '#dc2626',
                                        fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer'
                                    }}
                                >
                                    Decommission
                                </button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>¿Estás seguro de eliminar <strong>{asset?.name}</strong>? Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Cancelar</button>
                            <button onClick={handleDelete} style={{ background: 'var(--status-down)', color: 'white', border: 'none' }}>Sí, Eliminar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
