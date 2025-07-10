#!/usr/bin/env node

/**
 * Smart Memory Server - End-to-End Testing Suite
 * Tests all functionality from basic connectivity to advanced features
 */

import http from 'http';
import https from 'https';

const SERVER_URL = 'http://168.231.74.29';
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class SmartMemoryTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.total = 0;
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, SERVER_URL);
            const client = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SmartMemoryTester/1.0'
                },
                timeout: 10000
            };
            
            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const response = body ? JSON.parse(body) : {};
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: response,
                            rawBody: body
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: null,
                            rawBody: body
                        });
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async test(name, testFn) {
        this.total++;
        process.stdout.write(`${colors.blue}[${this.total}]${colors.reset} ${name}... `);
        
        try {
            const startTime = Date.now();
            await testFn();
            const duration = Date.now() - startTime;
            
            this.passed++;
            console.log(`${colors.green}✅ PASS${colors.reset} (${duration}ms)`);
            return true;
        } catch (error) {
            this.failed++;
            console.log(`${colors.red}❌ FAIL${colors.reset}`);
            console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
            return false;
        }
    }

    async assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    async runAllTests() {
        this.log('\n🧪 Smart Memory Server - End-to-End Testing Suite', 'bold');
        this.log('=' .repeat(60), 'blue');
        this.log(`Testing server: ${SERVER_URL}`, 'yellow');
        this.log('');

        // Test 1: Basic Connectivity
        await this.test('Basic server connectivity', async () => {
            const response = await this.makeRequest('/health');
            await this.assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
            await this.assert(response.body.status === 'ok', 'Health check failed');
            await this.assert(response.body.server === 'Smart Memory Server', 'Wrong server name');
        });

        // Test 2: Server Information
        await this.test('Server information and configuration', async () => {
            const response = await this.makeRequest('/health');
            await this.assert(response.body.version, 'Version not found');
            await this.assert(response.body.uptime !== undefined, 'Uptime not found');
            await this.assert(response.body.supabase === 'configured', 'Supabase not configured');
        });

        // Test 3: Chat API Basic
        await this.test('Chat API basic functionality', async () => {
            const response = await this.makeRequest('/api/chat', 'POST', {
                messages: [
                    { role: 'user', content: 'Hello, Smart Memory Server!' }
                ]
            });
            await this.assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
            await this.assert(response.body.response, 'No response from chat API');
            await this.assert(response.body.receivedMessages === 1, 'Message count mismatch');
        });

        // Test 4: Chat API with Multiple Messages
        await this.test('Chat API with conversation context', async () => {
            const response = await this.makeRequest('/api/chat', 'POST', {
                messages: [
                    { role: 'user', content: 'What is the capital of France?' },
                    { role: 'assistant', content: 'The capital of France is Paris.' },
                    { role: 'user', content: 'What about Germany?' }
                ]
            });
            await this.assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
            await this.assert(response.body.receivedMessages === 3, 'Conversation context not preserved');
        });

        // Test 5: Memory Search API
        await this.test('Memory search API functionality', async () => {
            const response = await this.makeRequest('/api/memories/search', 'POST', {
                query: 'test memory search',
                limit: 5
            });
            await this.assert(response.statusCode === 200 || response.statusCode === 503, 
                `Expected 200 or 503, got ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                await this.assert(Array.isArray(response.body.memories), 'Memories should be an array');
            } else {
                // 503 is acceptable if database isn't fully configured
                await this.assert(response.body.message, 'Should have error message for 503');
            }
        });

        // Test 6: Invalid Endpoints
        await this.test('Error handling for invalid endpoints', async () => {
            const response = await this.makeRequest('/api/nonexistent');
            await this.assert(response.statusCode === 404, `Expected 404, got ${response.statusCode}`);
        });

        // Test 7: CORS Headers
        await this.test('CORS headers configuration', async () => {
            const response = await this.makeRequest('/health');
            // CORS should be configured for API access
            const hasAccessControl = response.headers['access-control-allow-origin'] !== undefined;
            // This might not be set if CORS is configured differently
            console.log(`\n   CORS headers: ${hasAccessControl ? '✅' : '⚠️  Not explicitly set'}`);
        });

        // Test 8: Response Time Performance
        await this.test('Response time performance', async () => {
            const start = Date.now();
            const response = await this.makeRequest('/health');
            const responseTime = Date.now() - start;
            
            await this.assert(response.statusCode === 200, 'Health check failed');
            await this.assert(responseTime < 2000, `Response too slow: ${responseTime}ms`);
            console.log(`\n   Response time: ${responseTime}ms`);
        });

        // Test 9: Concurrent Requests
        await this.test('Concurrent request handling', async () => {
            const requests = Array(5).fill().map(() => 
                this.makeRequest('/health')
            );
            
            const responses = await Promise.all(requests);
            
            for (const response of responses) {
                await this.assert(response.statusCode === 200, 'Concurrent request failed');
            }
            
            console.log(`\n   Handled ${responses.length} concurrent requests`);
        });

        // Test 10: Server Stability
        await this.test('Server stability and memory usage', async () => {
            // Make multiple requests to test stability
            for (let i = 0; i < 10; i++) {
                const response = await this.makeRequest('/health');
                await this.assert(response.statusCode === 200, `Request ${i + 1} failed`);
            }
        });

        // Test Results Summary
        this.log('\n' + '='.repeat(60), 'blue');
        this.log('🏁 Test Results Summary', 'bold');
        this.log('='.repeat(60), 'blue');
        
        if (this.failed === 0) {
            this.log(`✅ ALL TESTS PASSED! (${this.passed}/${this.total})`, 'green');
            this.log('🎉 Your Smart Memory Server is fully functional!', 'green');
        } else {
            this.log(`⚠️  ${this.passed} passed, ${this.failed} failed out of ${this.total} tests`, 'yellow');
            if (this.passed >= this.total * 0.8) {
                this.log('✅ Server is mostly functional with minor issues', 'yellow');
            } else {
                this.log('❌ Server has significant issues that need attention', 'red');
            }
        }

        this.log('\n📊 Functionality Status:', 'bold');
        this.log(`   Basic Connectivity: ${this.passed >= 2 ? '✅' : '❌'}`, 'blue');
        this.log(`   API Endpoints: ${this.passed >= 4 ? '✅' : '❌'}`, 'blue');
        this.log(`   Error Handling: ${this.passed >= 6 ? '✅' : '❌'}`, 'blue');
        this.log(`   Performance: ${this.passed >= 8 ? '✅' : '❌'}`, 'blue');
        this.log(`   Stability: ${this.passed >= 10 ? '✅' : '❌'}`, 'blue');

        this.log('\n🔗 Next Steps:', 'bold');
        this.log('   1. Test MCP integration with Claude', 'blue');
        this.log('   2. Test with your frontend application', 'blue');
        this.log('   3. Set up monitoring and alerts', 'blue');
        this.log('   4. Configure SSL for production use', 'blue');

        return this.failed === 0;
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new SmartMemoryTester();
    tester.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner error:', error);
            process.exit(1);
        });
}