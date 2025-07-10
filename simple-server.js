import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
} else {
    console.log('Supabase configured successfully');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        server: 'Smart Memory Server',
        version: '1.0.0',
        uptime: process.uptime(),
        supabase: supabaseUrl ? 'configured' : 'missing'
    });
});

// Basic API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        res.json({ 
            response: 'Smart Memory Server is running! Full MCP implementation coming soon.',
            receivedMessages: messages?.length || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Memory search endpoint
app.post('/api/memories/search', async (req, res) => {
    try {
        const { query, limit = 5 } = req.body;
        
        if (!supabaseUrl || !supabaseKey) {
            return res.status(503).json({ 
                error: 'Supabase not configured',
                message: 'Memory search requires database configuration'
            });
        }

        // Simple search implementation
        const { data, error } = await supabase
            .from('memories')
            .select('*')
            .textSearch('content', query)
            .limit(limit);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ memories: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Smart Memory Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});