import React, { useState } from 'react';
import { api } from '../api/service';
import '../styles/LoginV2.css';

interface LoginProps {
    onSuccess: () => void;
}

export const LoginV2: React.FC<LoginProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOnline] = useState(navigator.onLine);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: authError } = await api.signIn(email, password);
            if (authError) throw authError;
            onSuccess();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-body">
            {/* Background Effects */}
            <div className="login-grid-bg"></div>
            <div className="scanlines"></div>

            <main className="login-container">
                <div className="login-card-wrapper">

                    {/* Header Branding */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="sentinel-glow">
                            <span className="material-icon" style={{ fontSize: '64px', color: '#d39b22' }}>warning</span>
                        </div>
                        <h1 className="login-title">
                            Sentinel <span style={{ color: '#d39b22' }}>Ops</span>
                        </h1>
                        <div className="login-subtitle">Acceso Seguro: Nivel 4</div>
                    </div>

                    {/* Login Form */}
                    <div className="login-form-card">
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div style={{
                                    padding: '0.75rem', marginBottom: '1.5rem',
                                    background: 'rgba(248, 81, 73, 0.15)', border: '1px solid rgba(248, 81, 73, 0.4)',
                                    color: '#f85149', borderRadius: '2px', fontSize: '0.8rem', fontFamily: 'monospace'
                                }}>
                                    ⚠ ERROR: {error.toUpperCase()}
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="login-label" htmlFor="email">Identificación de Operador</label>
                                <div className="input-group">
                                    <span className="material-icon input-icon">badge</span>
                                    <input
                                        className="industrial-input"
                                        id="email"
                                        type="email"
                                        placeholder="OP-XXXX-00"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label className="login-label" htmlFor="password">Clave de Acceso</label>
                                </div>
                                <div className="input-group">
                                    <span className="material-icon input-icon">key</span>
                                    <input
                                        className="industrial-input"
                                        id="password"
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                                {loading ? (
                                    'ACCEDIENDO...'
                                ) : (
                                    <>
                                        <span className="material-icon" style={{ fontSize: '20px' }}>login</span>
                                        ACCEDER AL SISTEMA
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--login-border)', paddingTop: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
                                Este sistema es para uso exclusivo de personal autorizado. El acceso no autorizado está prohibido y será monitoreado.
                            </p>
                        </div>
                    </div>

                    {/* Footer Status */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="status-badge">
                            <div className="ping-dot">
                                {isOnline && <span className="ping-animate"></span>}
                                <span className="ping-static" style={{ backgroundColor: isOnline ? '#10b981' : '#ef4444' }}></span>
                            </div>
                            <span className="login-label" style={{ margin: 0, color: '#94a3b8' }}>
                                ESTADO: <span style={{ color: isOnline ? '#10b981' : '#ef4444' }}>{isOnline ? 'EN LÍNEA' : 'OFFLINE'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Decorators */}
                    <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', opacity: 0.3, textAlign: 'right', display: 'none' }} className="md-visible">
                        <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748b' }}>LAT: 34.0522 N</p>
                    </div>

                </div>
            </main>
        </div>
    );
};
