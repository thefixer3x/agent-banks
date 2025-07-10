#!/usr/bin/env node

// Smart Memory Server MCP Client
// Connects to remote Smart Memory Server

import https from 'https';
import http from 'http';
import readline from 'readline';

const SERVER_URL = process.env.SMART_MEMORY_SERVER_URL || 'http://168.231.74.29';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// MCP protocol handler
async function handleMCPRequest(request) {
    try {
        const parsed = JSON.parse(request);
        
        if (parsed.method === 'list_tools') {
            return {
                tools: [
                    {
                        name: 'search_memories',
                        description: 'Search through Smart Memory Server',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Search query' },
                                limit: { type: 'number', default: 5 }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'chat',
                        description: 'Chat with Smart Memory Server',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                messages: { type: 'array', description: 'Chat messages' }
                            },
                            required: ['messages']
                        }
                    }
                ]
            };
        }
        
        if (parsed.method === 'call_tool') {
            const { name, arguments: args } = parsed.params;
            
            if (name === 'search_memories') {
                const response = await callAPI('/api/memories/search', {
                    query: args.query,
                    limit: args.limit || 5
                });
                return { content: [{ type: 'text', text: JSON.stringify(response) }] };
            }
            
            if (name === 'chat') {
                const response = await callAPI('/api/chat', {
                    messages: args.messages
                });
                return { content: [{ type: 'text', text: JSON.stringify(response) }] };
            }
        }
        
        return { error: 'Unknown method' };
    } catch (error) {
        return { error: error.message };
    }
}

// API caller
function callAPI(endpoint, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, SERVER_URL);
        const client = url.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ response: body });
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

// Main loop
console.log(JSON.stringify({
    type: 'mcp_server',
    name: 'smart-memory-server',
    version: '1.0.0',
    capabilities: {
        tools: {}
    }
}));

rl.on('line', async (line) => {
    try {
        const response = await handleMCPRequest(line);
        console.log(JSON.stringify(response));
    } catch (error) {
        console.log(JSON.stringify({ error: error.message }));
    }
});