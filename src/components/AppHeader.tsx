import React from 'react';
import type { Alert } from '../types';

interface AppHeaderProps {
    isOnline: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    alerts: Alert[];
    user: any;
    onScannerClick: () => void;
    onNotificationClick: () => void;
    toggleWebMCP: () => void;
    showWebMCP: boolean;
    onLogout: () => void;
    navigateTo: (page: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    isOnline, searchQuery, onSearchChange, alerts, user,
    onScannerClick, onNotificationClick, toggleWebMCP, showWebMCP, onLogout, navigateTo
}) => {
    return (
        <header className="header" style={{
            position: 'sticky', top: 0, zIndex: 1000,
            background: 'rgba(33, 28, 18, 0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            minHeight: 'var(--header-height)'
        }}>
            {/* Logo & Status */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 'fit-content', cursor: 'pointer' }}
                onClick={() => navigateTo('dashboard')}
            >
                <div style={{ color: 'var(--safety-yellow)', display: 'flex', alignItems: 'center' }}>
                    <span className="material-icon" style={{ fontSize: '36px' }}>local_shipping</span>
                </div>
                <div className="hidden-on-mobile">
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
                        FLEET<span style={{ color: 'var(--safety-yellow)' }}>OPS</span>
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '6px' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="status-pulse" style={{ position: 'absolute', height: '12px', width: '12px', borderRadius: '50%', background: isOnline ? '#4ade80' : '#f87171', opacity: 0.6 }}></span>
                            <span style={{ position: 'relative', height: '8px', width: '8px', borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444', boxShadow: isOnline ? '0 0 10px #22c55e' : '0 0 10px #ef4444' }}></span>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', color: '#c5b696', letterSpacing: '0.1em' }}>
                            {isOnline ? 'Network Active' : 'Offline Manifest'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search (Centered with constraints) */}
            <div className="header-search-container" style={{ display: 'flex', flex: 1, justifyContent: 'center', padding: '0 2rem', maxWidth: '32rem' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        type="text"
                        placeholder="OPERATIONAL SEARCH..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                            borderRadius: '4px', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'white', fontSize: '0.85rem',
                            outline: 'none', fontWeight: 600, transition: 'all 0.2s',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--safety-yellow)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <span className="material-icon" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
                </div>
            </div>

            {/* Header Actions & Profile */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 'fit-content' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={onScannerClick} className="icon-btn-square" title="System Sync/Scanner" style={{ width: '44px', height: '44px' }}>
                        <span className="material-icon">qr_code_scanner</span>
                    </button>
                    <button onClick={onNotificationClick} className="icon-btn-square relative" title="Alerts" style={{ width: '44px', height: '44px' }}>
                        <span className="material-icon">notifications</span>
                        {alerts.filter(a => !a.isResolved).length > 0 && (
                            <span className="notification-dot" style={{ top: '8px', right: '8px' }}></span>
                        )}
                    </button>
                    <button onClick={toggleWebMCP} className={`icon-btn-square ${showWebMCP ? 'active-tool' : ''}`} title="AI Agent Interface" style={{ width: '44px', height: '44px', color: showWebMCP ? 'var(--safety-yellow)' : 'inherit' }}>
                        <span className="material-icon">smart_toy</span>
                    </button>
                </div>

                <div className="user-profile-section" onClick={onLogout} style={{ paddingLeft: '1.25rem' }}>
                    <div className="hidden-on-mobile hidden-on-tablet" style={{ textAlign: 'right' }}>
                        <p className="user-name" style={{ fontSize: '0.9rem' }}>{user?.email || 'J. Connor'}</p>
                        <p className="user-role" style={{ fontSize: '0.65rem' }}>Lead Dispatch</p>
                    </div>
                    <div className="user-avatar" style={{
                        width: '44px', height: '44px',
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGxFESl-udutuPfdcRycTZdN6dCMxAJJLxl6y2WvtyIJbHQAXPP-SiuxJvU6ZvT1MV3V6uO1dw44jzRjfOhhWB94Tpg_qYgd87r0V9s9h9hxZG5sag5TuJ0LtlyXUivEXxg5JrV-D2iDe0HPCDZKk93BlWsPD1NR8-BUcHPXbjOtS99sVY9OyRUqX3M1CH76kWa4JHsn0c6gM76wvxNDrEbbh38Ik8RuXp96SdXbINPmyNZDVM1GtnieJJE3juDfxujh7rND-vHg")'
                    }}></div>
                </div>
            </div>
        </header>
    );
};
