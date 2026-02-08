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
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre del Equipo</label>
                            <input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Excavadora 320" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ID Interno</label>
                                <input name="internalId" value={formData.internalId} onChange={handleChange} required placeholder="Ej: MIN-EXC-01" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ubicación Actual</label>
                                <input name="location" value={formData.location} onChange={handleChange} required placeholder="Ej: Tajo Norte" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Marca</label>
                                <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Caterpillar" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Modelo</label>
                                <input name="model" value={formData.model} onChange={handleChange} placeholder="320 GC" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Categoría</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="heavy_machinery">Maquinaria Pesada</option>
                                <option value="light_vehicle">Vehículo Liviano</option>
                                <option value="plant_equipment">Equipo de Planta</option>
                                <option value="tool">Herramienta</option>
                            </select>
                        </div>

                        {/* QR Code Placeholder / Info */}
                        {isEdit && (
                            <div style={{ background: '#0D1117', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID de Sistema (Para QR):</p>
                                <code style={{ color: 'var(--safety-yellow)', fontSize: '1rem' }}>{asset.id}</code>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" style={{ flex: 1 }} disabled={loading}>
                                {loading ? 'Guardando...' : (isEdit ? 'Actualizar Activo' : 'Crear Activo')}
                            </button>

                            {isEdit && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{ background: 'transparent', border: '1px solid var(--status-down)', color: 'var(--status-down)' }}
                                >
                                    Eliminar
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
