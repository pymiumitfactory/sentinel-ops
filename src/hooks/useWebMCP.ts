// Deprecated: verify migration to @mcp-b/react-webmcp
export const useWebMCP = () => {
    console.warn('Using deprecated useWebMCP hook');
    return { isAvailable: false, registeredTools: [], registerTool: () => { } };
};
