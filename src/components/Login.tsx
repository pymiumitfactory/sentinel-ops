import React, { useState } from 'react';
import { api } from '../api/service';
import { AlertTriangleIcon } from './Icons';

interface LoginProps {
    onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await api.signIn(email, password);
            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{
                    width: 80, height: 80, margin: '0 auto 1rem',
                    background: 'rgba(210, 153, 34, 0.15)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--safety-yellow)'
                }}>
                    <AlertTriangleIcon size={48} color="var(--safety-yellow)" />
                </div>
                <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>Sentinel Ops</h1>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>Logueo de Operador</p>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '320px' }}>
                {error && (
                    <div style={{
                        padding: '1rem', marginBottom: '1.5rem',
                        background: 'rgba(248, 81, 73, 0.15)', border: '1px solid rgba(248, 81, 73, 0.4)',
                        color: '#f85149', borderRadius: '6px', fontSize: '0.9rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Credencial ID (Email)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="operador@sentinel.com"
                        style={{ width: '100%', padding: '0.8rem', background: '#0d1117', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Clave de Acceso</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '0.8rem', background: '#0d1117', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%', padding: '1rem',
                        background: 'var(--safety-yellow)', color: 'black',
                        border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '1rem',
                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(210, 153, 34, 0.3)'
                    }}
                >
                    {loading ? 'Verificando...' : 'Acceder al Sistema'}
                </button>
            </form>

            <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                v1.0.0 Alpha • Offline Ready
            </div>
        </div>
    );
};
