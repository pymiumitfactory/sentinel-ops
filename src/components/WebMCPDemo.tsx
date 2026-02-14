import React, { useEffect, useState, useRef } from 'react';
import { useWebMCP } from '@mcp-b/react-webmcp';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { api } from '../api/service';
import type { Asset, Alert } from '../types';
import '../styles/industrial-theme.css';

interface LogEntry {
    id: string;
    timestamp: string;
    type: 'info' | 'tool_call' | 'tool_result' | 'error';
    message: string;
    details?: any;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
}

interface WebMCPDemoProps {
    onNavigate: (page: string, filter?: string) => void;
    onSimulateAlert: (message: string, severity: 'low' | 'medium' | 'high' | 'critical') => void;
    onShowAsset: (assetId: string) => Promise<boolean>;
}

const WebMCPDemo: React.FC<WebMCPDemoProps> = ({ onNavigate, onSimulateAlert, onShowAsset }) => {
    // ... existing UI state ...
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<'chat' | 'debug'>('chat');

    // ... existing logic state ...
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isAvailable, setIsAvailable] = useState(false);

    // ... (keep Chat/Gemini/Ref states) ...
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [isProcessing, setIsProcessing] = useState(false);

    const toolRegistry = useRef<Record<string, any>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... (keep useEffects for persistence/scroll/availability) ...
    useEffect(() => {
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, activeView, isExpanded]);

    useEffect(() => {
        const check = () => {
            // @ts-ignore
            if (window.navigator.modelContext || window.modelContext) {
                setIsAvailable(true);
            }
        };
        check();
        const interval = setInterval(check, 1000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (type: LogEntry['type'], message: string, details?: any) => {
        setLogs(prev => [{
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            type,
            message,
            details
        }, ...prev]);
    };

    // --- TOOL DEFINITIONS ---

    const statusTool = useWebMCP({
        name: 'get_system_status',
        description: 'Returns the real-time operational status of the SentinelOps platform from the database.',
        inputSchema: {
            detail_level: z.enum(['summary', 'full']).describe('Level of detail for the status report.')
        },
        handler: async (args) => {
            addLog('tool_call', 'get_system_status called', args);
            // Fetch real data
            const [assets, alerts] = await Promise.all([
                api.getAssets(),
                api.getAlerts()
            ]);

            const activeCount = assets.filter(a => a.status === 'active').length;
            const maintCount = assets.filter(a => a.status === 'maintenance').length;
            const downCount = assets.filter(a => a.status === 'down').length;

            return {
                status: downCount > 0 ? 'critical' : (maintCount > 0 ? 'warning' : 'nominal'),
                total_assets: assets.length,
                fleet_health: `${Math.round((activeCount / assets.length) * 100)}%`,
                breakdown: { active: activeCount, maintenance: maintCount, critical: downCount },
                active_alerts: alerts.length,
                timestamp: new Date().toISOString()
            };
        }
    });

    const assetsTool = useWebMCP({
        name: 'list_recent_assets',
        description: 'Lists the most recently modified industrial assets tracked by the system.',
        inputSchema: {
            limit: z.number().optional().describe('Number of assets to return (default 5)')
        },
        handler: async (args) => {
            addLog('tool_call', 'list_recent_assets called', args);
            const assets = await api.getAssets();
            // Sort by ID or creation if timestamps aren't perfect, for now just slice
            return assets.slice(0, args.limit || 5).map(a => ({
                id: a.internalId || a.id,
                name: a.name,
                status: a.status,
                location: a.location
            }));
        }
    });

    const alertTool = useWebMCP({
        name: 'simulate_alert',
        description: 'Simulates a critical alert on the dashboard for testing purposes.',
        inputSchema: {
            message: z.string().describe('The alert message content.'),
            severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Severity level of the alert.')
        },
        handler: async (args) => {
            addLog('tool_call', 'simulate_alert called', args);
            onSimulateAlert(args.message, args.severity as any);
            return { success: true, alerted: args.message };
        }
    });

    const navTool = useWebMCP({
        name: 'navigate_to_page',
        description: 'Navigates the user interface to a specific section. Use "assets" page with a filter to show specific lists.',
        inputSchema: {
            page: z.enum(['dashboard', 'assets', 'settings', 'map', 'scanner']).describe('The destination page identifier.'),
            filter: z.enum(['all', 'active', 'maintenance', 'critical']).optional().describe('Optional filter to apply when navigating to assets page.')
        },
        handler: async (args) => {
            addLog('tool_call', 'navigate_to_page called', args);
            onNavigate(args.page, args.filter);
            return { success: true, current_page: args.page, filter_applied: args.filter };
        }
    });

    const ticketTool = useWebMCP({
        name: 'create_maintenance_ticket',
        description: 'Creates a new maintenance ticket (simulated via Alert system) for a specific asset.',
        inputSchema: {
            asset_id: z.string().describe('The ID of the asset requiring maintenance (e.g., MIN-EXC-001).'),
            priority: z.enum(['low', 'normal', 'urgent']).describe('Priority level of the maintenance.'),
            description: z.string().describe('Detailed description of the issue.'),
            requires_shutdown: z.boolean().describe('Whether the asset needs to be shut down for maintenance.')
        },
        handler: async (args) => {
            addLog('tool_call', 'create_maintenance_ticket called', args);

            // Try to set status to maintenance via API
            try {
                const assets = await api.getAssets();
                const asset = assets.find(a => a.internalId === args.asset_id || a.id === args.asset_id);

                if (asset) {
                    await api.updateAsset(asset.id, { status: args.requires_shutdown ? 'down' : 'maintenance' });
                    onShowAsset(asset.id); // Show drawer
                } else {
                    return { success: false, error: 'Asset not found' };
                }

                // Create alert notification
                onSimulateAlert(`Ticket Created: ${args.description} for ${args.asset_id}`, 'medium');

                return {
                    success: true,
                    ticket_id: `TKT-${Math.floor(Math.random() * 1000)}`,
                    status: 'assigned',
                    asset_updated: true
                };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    const detailsTool = useWebMCP({
        name: 'get_asset_details',
        description: 'Retrieves full technical details, status, and history for a specific asset.',
        inputSchema: {
            asset_id: z.string().describe('The ID or internal ID of the asset (e.g., MIN-EXC-001).')
        },
        handler: async (args) => {
            addLog('tool_call', 'get_asset_details called', args);
            const assets = await api.getAssets();
            const asset = assets.find(a => a.internalId === args.asset_id || a.id === args.asset_id);

            if (!asset) return { error: 'Asset not found' };

            // In a real app, this would fetch specific details from a separate endpoint
            return {
                ...asset,
                specs: {
                    engine: 'C-15 Acert',
                    power: '500 HP',
                    operating_weight: '95,000 kg',
                    bucket_capacity: '6.0 m3'
                },
                last_maintenance: '2023-11-15',
                next_scheduled: '2024-02-20'
            };
        }
    });

    useEffect(() => {
        toolRegistry.current = {
            get_system_status: statusTool,
            list_recent_assets: assetsTool,
            simulate_alert: alertTool,
            navigate_to_page: navTool,
            create_maintenance_ticket: ticketTool,
            get_asset_details: detailsTool
        };
    }, [statusTool, assetsTool, alertTool, navTool, ticketTool, detailsTool]);

    // --- GEMINI HANDLER ---

    const handleSend = async () => {
        if (!currentInput.trim()) return;
        if (!apiKey) {
            setShowSettings(true);
            return;
        }

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: currentInput,
            timestamp: new Date()
        };

        setChatHistory(prev => [...prev, userMsg]);
        setCurrentInput('');
        setIsProcessing(true);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);

            // Define tools schema for Gemini
            const tools = [{
                functionDeclarations: [
                    { name: "get_system_status", description: "Get system status", parameters: { type: "OBJECT", properties: { detail_level: { type: "STRING", enum: ["summary", "full"] } }, required: ["detail_level"] } },
                    { name: "list_recent_assets", description: "List assets", parameters: { type: "OBJECT", properties: { limit: { type: "NUMBER" } } } },
                    { name: "simulate_alert", description: "Simulate alert", parameters: { type: "OBJECT", properties: { message: { type: "STRING" }, severity: { type: "STRING", enum: ["low", "medium", "high", "critical"] } }, required: ["message", "severity"] } },
                    { name: "navigate_to_page", description: "Navigate", parameters: { type: "OBJECT", properties: { page: { type: "STRING", enum: ["dashboard", "assets", "settings", "map", "scanner"] }, filter: { type: "STRING", enum: ["all", "active", "maintenance", "critical"] } }, required: ["page"] } },
                    { name: "create_maintenance_ticket", description: "Create ticket", parameters: { type: "OBJECT", properties: { asset_id: { type: "STRING" }, priority: { type: "STRING", enum: ["low", "normal", "urgent"] }, description: { type: "STRING" }, requires_shutdown: { type: "BOOLEAN" } }, required: ["asset_id", "priority", "description", "requires_shutdown"] } },
                    { name: "get_asset_details", description: "Get asset details", parameters: { type: "OBJECT", properties: { asset_id: { type: "STRING" } }, required: ["asset_id"] } }
                ]
            }];

            // @ts-ignore
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", tools });
            const chat = model.startChat();

            // Send user message
            const result = await chat.sendMessage(userMsg.content);
            const response = await result.response;
            const calls = response.functionCalls();

            let finalResponseText = "";

            if (calls && calls.length > 0) {
                const toolParts = [];
                for (const call of calls) {
                    if (toolRegistry.current[call.name]) {
                        addLog('info', `Executing tool: ${call.name}`);
                        const output = await toolRegistry.current[call.name].execute(call.args);
                        addLog('tool_result', `Result from ${call.name}`, output);
                        toolParts.push({
                            functionResponse: {
                                name: call.name,
                                response: { result: output }
                            }
                        });
                    }
                }
                const finalResult = await chat.sendMessage(toolParts);
                finalResponseText = (await finalResult.response).text();
            } else {
                finalResponseText = response.text();
            }

            setChatHistory(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'agent',
                content: finalResponseText,
                timestamp: new Date()
            }]);

        } catch (e: any) {
            addLog('error', 'Gemini Error', e.message);
            setChatHistory(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'agent',
                content: `Error: ${e.message}. Please try again later or check API key.`,
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDER ---

    if (!isExpanded) {
        return (
            <div className="agent-widget-container">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="agent-button"
                >
                    <span className="material-icon">smart_toy</span>
                    <span>Sentinel Agent</span>
                    <span className="agent-status-dot"></span>
                </button>
            </div>
        );
    }

    return (
        <div className="agent-panel">

            {/* Header */}
            <div className="agent-header">
                <div className="agent-title">
                    <span className="material-icon" style={{ color: 'var(--safety-yellow)' }}>smart_toy</span>
                    <span>Sentinel Ops AI</span>
                </div>
                <div className="agent-controls">
                    <button
                        onClick={() => setActiveView(activeView === 'chat' ? 'debug' : 'chat')}
                        className="icon-btn-sm"
                        title={activeView === 'chat' ? "Show Logs" : "Show Chat"}
                    >
                        <span className="material-icon">{activeView === 'chat' ? 'terminal' : 'chat'}</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="icon-btn-sm"
                        title="Settings"
                    >
                        <span className="material-icon">settings</span>
                    </button>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="icon-btn-sm"
                        title="Minimize"
                    >
                        <span className="material-icon">expand_more</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="agent-content-area">

                {/* Settings Overlay */}
                {showSettings && (
                    <div className="settings-overlay">
                        <div className="settings-card">
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icon" style={{ color: 'var(--safety-yellow)' }}>vpn_key</span>
                                API Configuration
                            </h4>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gemini API Token</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your AIStudio key..."
                                />
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Key is stored locally in your browser.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="agent-button"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Save & Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Chat View */}
                {activeView === 'chat' && (
                    <div className="chat-view">
                        {chatHistory.length === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, color: 'var(--text-secondary)' }}>
                                <span className="material-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>forum</span>
                                <p>Operational Assistant Ready.</p>
                            </div>
                        )}
                        {chatHistory.map(msg => (
                            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                <span className="chat-timestamp">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="chat-bubble agent">
                                <div className="typing-dots">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Debug View */}
                {activeView === 'debug' && (
                    <div className="debug-view">
                        <div className="debug-header">
                            <span>System Terminal</span>
                            <button
                                onClick={() => setLogs([])}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', textTransform: 'uppercase' }}
                            >
                                Clear
                            </button>
                        </div>
                        <div className="debug-content">
                            {logs.map(log => (
                                <div key={log.id} className={`log-entry ${log.type}`}>
                                    <div className="log-header">
                                        <span>{log.timestamp}</span>
                                        <span className="log-type">{log.type}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>{log.message}</div>
                                    {log.details && (
                                        <pre style={{ marginTop: '0.5rem', color: 'var(--text-muted)', overflowX: 'auto' }}>
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions (Suggestions) */}
                {activeView === 'chat' && !isProcessing && chatHistory.length === 0 && (
                    <div style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[
                            { label: 'System Status', cmd: 'Get full system status report' },
                            { label: 'Recent Assets', cmd: 'List real assets from database' },
                            { label: 'Simulate Alert', cmd: 'Simulate a critical engine overheat alert' },
                            { label: 'Open Scanner', cmd: 'Navigate to scanner' },
                        ].map((action) => (
                            <button
                                key={action.label}
                                onClick={() => setCurrentInput(action.cmd)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '20px',
                                    padding: '0.4rem 0.8rem',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--safety-yellow)';
                                    e.currentTarget.style.color = 'var(--safety-yellow)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="agent-input-container">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={apiKey ? "Command link established..." : "Configure API key required..."}
                        disabled={!apiKey || isProcessing}
                        className="agent-input"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!apiKey || isProcessing || !currentInput.trim()}
                        className="send-btn"
                    >
                        <span className="material-icon">send</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WebMCPDemo;
