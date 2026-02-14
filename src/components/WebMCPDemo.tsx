import React, { useEffect, useState, useRef } from 'react';
import { useWebMCP } from '@mcp-b/react-webmcp';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

const WebMCPDemo: React.FC = () => {
    // UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<'chat' | 'debug'>('chat');

    // Logic State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isAvailable, setIsAvailable] = useState(false);

    // Chat State
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');

    // Gemini State
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [isProcessing, setIsProcessing] = useState(false);

    // Ref to access current tools in handlers (avoid stale closures)
    const toolRegistry = useRef<Record<string, any>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Persist API Key
    useEffect(() => {
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
    }, [apiKey]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, activeView, isExpanded]);

    // Check for availability
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
        description: 'Returns the current operational status of the SentinelOps platform.',
        inputSchema: {
            detail_level: z.enum(['summary', 'full']).describe('Level of detail for the status report.')
        },
        handler: async (args) => {
            addLog('tool_call', 'get_system_status called', args);
            return {
                status: 'operational',
                active_alerts: 2,
                sensors_online: 145,
                uptime: '99.9%',
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
            return [
                { id: 'A-101', name: 'Hydraulic Pump X5', status: 'maintenance' },
                { id: 'A-102', name: 'Conveyor Belt Motor', status: 'active' },
                { id: 'A-104', name: 'Cooling Tower Fan', status: 'warning' },
            ].slice(0, args.limit || 5);
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
            return { success: true, alerted: args.message };
        }
    });

    const navTool = useWebMCP({
        name: 'navigate_to_page',
        description: 'Navigates the user interface to a specific section of the application.',
        inputSchema: {
            page: z.enum(['dashboard', 'assets', 'settings', 'map']).describe('The destination page identifier.')
        },
        handler: async (args) => {
            addLog('tool_call', 'navigate_to_page called', args);
            return { success: true, previous_page: 'agent-interface', current_page: args.page };
        }
    });

    const ticketTool = useWebMCP({
        name: 'create_maintenance_ticket',
        description: 'Creates a new maintenance ticket for a specific asset.',
        inputSchema: {
            asset_id: z.string().describe('The ID of the asset requiring maintenance (e.g., A-101).'),
            priority: z.enum(['low', 'normal', 'urgent']).describe('Priority level of the maintenance.'),
            description: z.string().describe('Detailed description of the issue.'),
            requires_shutdown: z.boolean().describe('Whether the asset needs to be shut down for maintenance.')
        },
        handler: async (args) => {
            addLog('tool_call', 'create_maintenance_ticket called', args);
            return {
                success: true,
                ticket_id: `TKT-${Math.floor(Math.random() * 1000)}`,
                status: 'assigned',
                estimated_completion: '24h'
            };
        }
    });

    useEffect(() => {
        toolRegistry.current = {
            get_system_status: statusTool,
            list_recent_assets: assetsTool,
            simulate_alert: alertTool,
            navigate_to_page: navTool,
            create_maintenance_ticket: ticketTool
        };
    }, [statusTool, assetsTool, alertTool, navTool, ticketTool]);

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
                    { name: "navigate_to_page", description: "Navigate", parameters: { type: "OBJECT", properties: { page: { type: "STRING", enum: ["dashboard", "assets", "settings", "map"] } }, required: ["page"] } },
                    { name: "create_maintenance_ticket", description: "Create ticket", parameters: { type: "OBJECT", properties: { asset_id: { type: "STRING" }, priority: { type: "STRING", enum: ["low", "normal", "urgent"] }, description: { type: "STRING" }, requires_shutdown: { type: "BOOLEAN" } }, required: ["asset_id", "priority", "description", "requires_shutdown"] } }
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
                content: `Error: ${e.message}. Check your API Key.`,
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
