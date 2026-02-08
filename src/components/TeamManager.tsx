import React, { useEffect, useState } from 'react';
import { api } from '../api/service';
import { XIcon, PlusIcon } from './Icons';

interface TeamMember {
    id: string;
    full_name: string;
    role: 'admin' | 'supervisor' | 'operator';
    org_id: string;
}

interface TeamManagerProps {
    onClose: () => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ onClose }) => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.getTeamMembers();
            setMembers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        // Since we don't have a backend to send emails yet, we'll simulate it for MVP
        alert(`Invitación simulada enviada a ${inviteEmail}.\n\nPara producción, compartir este link de registro: sentinel.app/register?org=${members[0]?.org_id}`);
        setShowInvite(false);
        setInviteEmail('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px', width: '95%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Equipo de Operaciones</h2>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {members.length} miembros activos
                        </span>
                    </div>
                    <button onClick={onClose} className="icon-btn"><XIcon size={24} /></button>
                </div>

                {loading ? (
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                ) : (
                    <>
                        <div className="table-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>NOMBRE</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ROL</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ESTADO</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.id} style={{ borderBottom: '1px solid #30363d' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: 'var(--primary-color)', color: 'black',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {member.full_name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{member.full_name || 'Sin Nombre'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                                                    background: member.role === 'admin' ? 'rgba(210, 153, 34, 0.2)' : 'rgba(56, 139, 253, 0.2)',
                                                    color: member.role === 'admin' ? 'var(--safety-yellow)' : '#58a6ff',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ color: 'var(--status-ok)' }}>● Activo</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!showInvite ? (
                            <button
                                onClick={() => setShowInvite(true)}
                                style={{
                                    marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'var(--primary-color)', color: 'black', border: 'none',
                                    padding: '0.8rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                <PlusIcon size={20} color="black" /> Invitar Miembro
                            </button>
                        ) : (
                            <form onSubmit={handleInvite} style={{ marginTop: '1.5rem', padding: '1rem', background: '#161b22', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ margin: '0 0 1rem' }}>Invitar Nuevo Usuario</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        style={{ flex: 1, padding: '0.8rem', background: '#0d1117', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }}
                                    />
                                    <button type="submit" style={{ background: 'var(--status-ok)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                                        Enviar
                                    </button>
                                    <button type="button" onClick={() => setShowInvite(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
