#!/usr/bin/env node

/**
 * Privacy-Protecting API Gateway for Sub-Selling Services
 * Masks vendor and client identities while proxying API requests
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.GATEWAY_PORT || 3001;

// Enhanced middleware for privacy protection
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins but log them
    console.log(`[PRIVACY] Request from origin: ${origin || 'direct'}`);
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't expose client IP in headers
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Generate anonymous session key instead of using IP
    const sessionId = req.headers['x-session-id'] || 
                     req.headers['authorization']?.substring(0, 20) || 
                     'anonymous';
    return crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 16);
  }
});

// Different rate limits for different endpoints
const chatRateLimit = createRateLimit(60 * 1000, 100, 'Chat rate limit exceeded');
const generalRateLimit = createRateLimit(60 * 1000, 200, 'Rate limit exceeded');

// Privacy protection middleware
const privacyProtection = (req, res, next) => {
  // Generate anonymous request ID
  req.anonymousId = crypto.randomBytes(16).toString('hex');
  
  // Strip identifying headers
  delete req.headers['x-real-ip'];
  delete req.headers['x-forwarded-for'];
  delete req.headers['x-forwarded-host'];
  delete req.headers['cf-connecting-ip'];
  
  // Add anonymous tracking
  req.clientFingerprint = crypto.createHash('sha256')
    .update(req.headers['user-agent'] || '')
    .update(req.headers['accept-language'] || '')
    .digest('hex').substring(0, 12);
  
  // Log anonymized request
  console.log(`[GATEWAY] Anonymous request ${req.anonymousId} from client ${req.clientFingerprint}`);
  
  next();
};

app.use(privacyProtection);

// Vendor API configuration
const VENDOR_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKey: process.env.OPENAI_API_KEY
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    authHeader: 'x-api-key',
    authPrefix: '',
    apiKey: process.env.ANTHROPIC_API_KEY,
    additionalHeaders: {
      'anthropic-version': '2023-06-01'
    }
  },
  custom: {
    baseUrl: process.env.CUSTOM_VENDOR_URL,
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKey: process.env.CUSTOM_VENDOR_KEY
  }
};

// Utility functions for privacy protection
const sanitizeRequest = (body) => {
  // Remove any PII or identifying information
  const sanitized = JSON.parse(JSON.stringify(body));
  
  // Remove potential PII fields
  delete sanitized.user_id;
  delete sanitized.email;
  delete sanitized.ip_address;
  delete sanitized.session_id;
  
  return sanitized;
};

const sanitizeResponse = (data) => {
  // Remove vendor-specific identifiers from response
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Remove vendor-specific metadata
  delete sanitized.model_version;
  delete sanitized.provider_id;
  delete sanitized.internal_request_id;
  
  // Replace vendor branding with VortexAI branding
  if (sanitized.model) {
    sanitized.model = sanitized.model.replace(/gpt-|claude-|palm-/, 'vortex-');
  }
  
  return sanitized;
};

// Proxy function with privacy protection
const proxyToVendor = async (req, vendor, endpoint) => {
  const config = VENDOR_CONFIGS[vendor];
  if (!config || !config.apiKey) {
    throw new Error(`Vendor ${vendor} not configured or API key missing`);
  }

  const url = `${config.baseUrl}${endpoint}`;
  const sanitizedBody = sanitizeRequest(req.body);

  // Create anonymous headers for vendor request
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'VortexAI-Gateway/1.0',
    [config.authHeader]: `${config.authPrefix}${config.apiKey}`,
    ...config.additionalHeaders
  };

  // Add request tracking for billing
  const requestStartTime = Date.now();
  
  console.log(`[PROXY] Forwarding anonymous request ${req.anonymousId} to ${vendor}`);

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: JSON.stringify(sanitizedBody)
    });

    const responseTime = Date.now() - requestStartTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[VENDOR_ERROR] ${vendor} API error:`, response.status, errorText);
      throw new Error(`Vendor API error: ${response.status}`);
    }

    const data = await response.json();
    const sanitizedResponse = sanitizeResponse(data);

    // Log for billing (anonymized)
    console.log(`[BILLING] Request ${req.anonymousId}: ${vendor} - ${responseTime}ms - ${JSON.stringify(sanitizedBody).length} chars`);

    return {
      success: true,
      data: sanitizedResponse,
      vendor: 'vortexai', // Always return VortexAI as vendor
      response_time: responseTime,
      anonymous_id: req.anonymousId
    };

  } catch (error) {
    console.error(`[PROXY_ERROR] Failed to proxy to ${vendor}:`, error.message);
    throw error;
  }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VortexAI Privacy Gateway',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Chat completions endpoint
app.post('/api/v1/chat/completions', chatRateLimit, async (req, res) => {
  try {
    // Determine vendor based on request or use default
    const vendor = req.headers['x-vendor'] || 'openai';
    
    if (!VENDOR_CONFIGS[vendor]) {
      return res.status(400).json({ error: 'Unsupported vendor' });
    }

    const result = await proxyToVendor(req, vendor, '/chat/completions');
    
    res.json({
      ...result.data,
      // Add VortexAI metadata
      provider: 'vortexai',
      gateway_version: '1.0.0',
      response_time: result.response_time
    });

  } catch (error) {
    console.error(`[API_ERROR] Chat completion failed:`, error.message);
    res.status(500).json({
      error: 'Service temporarily unavailable',
      code: 'gateway_error',
      anonymous_id: req.anonymousId
    });
  }
});

// Completions endpoint (for non-chat models)
app.post('/api/v1/completions', generalRateLimit, async (req, res) => {
  try {
    const vendor = req.headers['x-vendor'] || 'openai';
    const result = await proxyToVendor(req, vendor, '/completions');
    
    res.json({
      ...result.data,
      provider: 'vortexai',
      gateway_version: '1.0.0'
    });

  } catch (error) {
    console.error(`[API_ERROR] Completion failed:`, error.message);
    res.status(500).json({
      error: 'Service temporarily unavailable',
      code: 'gateway_error'
    });
  }
});

// Embeddings endpoint
app.post('/api/v1/embeddings', generalRateLimit, async (req, res) => {
  try {
    const vendor = req.headers['x-vendor'] || 'openai';
    const result = await proxyToVendor(req, vendor, '/embeddings');
    
    res.json({
      ...result.data,
      provider: 'vortexai'
    });

  } catch (error) {
    console.error(`[API_ERROR] Embeddings failed:`, error.message);
    res.status(500).json({
      error: 'Service temporarily unavailable',
      code: 'gateway_error'
    });
  }
});

// Models endpoint (return VortexAI branded models)
app.get('/api/v1/models', generalRateLimit, (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'vortex-chat',
        object: 'model',
        created: Date.now(),
        owned_by: 'vortexai',
        permission: [],
        root: 'vortex-chat',
        parent: null
      },
      {
        id: 'vortex-completion',
        object: 'model', 
        created: Date.now(),
        owned_by: 'vortexai',
        permission: [],
        root: 'vortex-completion',
        parent: null
      }
    ]
  });
});

// Generic proxy endpoint for custom vendors
app.use('/api/v1/proxy/:vendor/*', generalRateLimit, async (req, res) => {
  try {
    const vendor = req.params.vendor;
    const endpoint = '/' + req.params[0];
    
    const result = await proxyToVendor(req, vendor, endpoint);
    res.json(result.data);

  } catch (error) {
    console.error(`[PROXY_ERROR] Custom endpoint failed:`, error.message);
    res.status(500).json({
      error: 'Proxy service unavailable',
      code: 'proxy_error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(`[GATEWAY_ERROR] ${req.anonymousId}:`, error);
  res.status(500).json({
    error: 'Internal gateway error',
    anonymous_id: req.anonymousId
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      '/api/v1/chat/completions',
      '/api/v1/completions', 
      '/api/v1/embeddings',
      '/api/v1/models',
      '/health'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[GATEWAY] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[GATEWAY] Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 VortexAI Privacy Gateway running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API endpoint: http://localhost:${PORT}/api/v1/`);
  console.log(`🛡️  Privacy protection: ENABLED`);
  console.log(`📊 Request logging: ANONYMIZED`);
});

module.exports = app;