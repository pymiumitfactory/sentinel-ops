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
        <div
            className="drawer-overlay"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(0, 0, 0, 0.7)', cursor: 'default' }}
            onClick={(e) => {
                // Clicking the overlay should NOT close the drawer per USER request
                e.stopPropagation();
            }}
        >
            <div
                className="drawer-panel"
                style={{ width: '480px', maxWidth: '100%', borderLeft: '1px solid #453b26', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                            {isEdit ? 'Asset Revision' : 'Asset Commissioning'}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: '#c5b696', fontSize: '0.85rem' }}>
                            {isEdit ? 'Modifying unit parameters' : 'Registering new unit to Sector 7G'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#2a2417', border: '1px solid #453b26', color: '#c5b696',
                            width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <span className="material-icon" style={{ fontSize: '18px' }}>close</span>
                    </button>
                </div>

                {!showDeleteConfirm ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                        <div style={{ borderBottom: '1px solid #2a2417', paddingBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Designation</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. CAT EXCAVATOR 320"
                                style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '1rem', color: 'white', fontWeight: 600, outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderBottom: '1px solid #2a2417', paddingBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Internal ID</label>
                                <input name="internalId" value={formData.internalId} onChange={handleChange} required placeholder="EXC-001" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '1rem', color: 'white', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployment Area</label>
                                <input name="location" value={formData.location} onChange={handleChange} required placeholder="Sector 7G" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '1rem', color: 'white', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderBottom: '1px solid #2a2417', paddingBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manufacture</label>
                                <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Caterpillar" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '1rem', color: 'white', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specification</label>
                                <input name="model" value={formData.model} onChange={handleChange} placeholder="320 GC" style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '1rem', color: 'white', outline: 'none' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#c5b696', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    style={{ width: '100%', background: '#0d1117', border: '1px solid #453b26', borderRadius: '4px', padding: '1rem', color: 'white', cursor: 'pointer', appearance: 'none', outline: 'none' }}
                                >
                                    <option value="heavy_machinery">Heavy Machinery</option>
                                    <option value="light_vehicle">Light Vehicle</option>
                                    <option value="transport">Transport / Logistics</option>
                                    <option value="utility">Utility / Plant</option>
                                </select>
                                <span className="material-icon" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b5d3a', pointerEvents: 'none' }}>expand_more</span>
                            </div>
                        </div>

                        {isEdit && (
                            <div style={{ background: 'rgba(211, 155, 34, 0.05)', padding: '1.25rem', borderRadius: '4px', border: '1px dashed #d29922', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#d29922', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Tracking ID (QR Source)</p>
                                <code style={{ color: 'white', fontSize: '0.9rem', display: 'block', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>{asset.id}</code>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '2rem' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ flex: 2, height: '56px' }}
                            >
                                {loading ? 'Processing...' : (isEdit ? 'Apply Changes' : 'Confirm Registration')}
                            </button>

                            {isEdit && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="btn-secondary"
                                    style={{ flex: 1, height: '56px', borderColor: '#dc2626', color: '#dc2626' }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <div style={{ color: '#dc2626', marginBottom: '1.5rem' }}>
                            <span className="material-icon" style={{ fontSize: '48px' }}>warning</span>
                        </div>
                        <h3 style={{ margin: '0 0 1rem', color: 'white' }}>Confirm Removal</h3>
                        <p style={{ color: '#c5b696', marginBottom: '2rem', lineHeight: 1.5 }}>
                            You are about to decommission <strong>{asset?.name}</strong>. This unit will be removed from all active manifests.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>Abort</button>
                            <button onClick={handleDelete} className="btn-primary" style={{ flex: 1, background: '#dc2626', boxShadow: '0 0 15px rgba(220, 38, 38, 0.3)' }}>Confirm Deletion</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
