#!/usr/bin/env node

/**
 * Deployment Preparation Script for SD-Ghost Protocol MCP Server
 * This script prepares the application for deployment to Hostinger
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Preparing SD-Ghost Protocol for Hostinger deployment...\n');

async function checkEnvironment() {
  console.log('📋 Checking environment...');
  
  // Check Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion < 18) {
    throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
  }
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  // Check for .env.production
  const envPath = join(rootDir, '.env.production');
  try {
    await fs.access(envPath);
    console.log('✅ .env.production found');
  } catch {
    console.log('❌ .env.production not found');
    console.log('   Creating from template...');
    await fs.copyFile(
      join(rootDir, '.env.production.example'),
      envPath
    );
    console.log('   ⚠️  Please edit .env.production with your actual values');
  }
}

async function buildApplication() {
  console.log('\n📦 Building application...');
  
  try {
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm ci --production=false', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    
    // Build frontend
    console.log('Building frontend...');
    execSync('npm run build', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    
    console.log('✅ Build completed');
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
}

async function prepareMCPServer() {
  console.log('\n🔧 Preparing MCP server...');
  
  const mcpDir = join(rootDir, 'mcp-server');
  
  // Install MCP server dependencies
  console.log('Installing MCP server dependencies...');
  execSync('npm ci --production', { 
    cwd: mcpDir, 
    stdio: 'inherit' 
  });
  
  console.log('✅ MCP server prepared');
}

async function createDeploymentPackage() {
  console.log('\n📦 Creating deployment package...');
  
  const deployDir = join(rootDir, 'deployment');
  
  // Create deployment directory
  await fs.mkdir(deployDir, { recursive: true });
  
  // Create deployment info
  const deployInfo = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    environment: 'production',
    files: [
      'dist/',
      'mcp-server/',
      'supabase/migrations/',
      '.env.production',
      'ecosystem.config.js',
      'package.json',
      'package-lock.json'
    ]
  };
  
  await fs.writeFile(
    join(deployDir, 'deploy-info.json'),
    JSON.stringify(deployInfo, null, 2)
  );
  
  // Create deployment script
  const deployScript = `#!/bin/bash
# SD-Ghost Protocol Deployment Script

echo "🚀 Deploying SD-Ghost Protocol..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Run migrations
npm run migrate:production

# Restart services
pm2 restart sd-ghost-mcp

echo "✅ Deployment complete!"
`;

  await fs.writeFile(
    join(deployDir, 'deploy.sh'),
    deployScript,
    { mode: 0o755 }
  );
  
  console.log('✅ Deployment package created');
}

async function generateDocumentation() {
  console.log('\n📚 Generating deployment documentation...');
  
  const apiDocs = `# SD-Ghost Protocol MCP API Documentation

## Base URL
\`https://your-domain.com/api\`

## Authentication
All requests require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer your-api-key
\`\`\`

## Endpoints

### POST /api/chat
Send a message to the AI assistant

**Request Body:**
\`\`\`json
{
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ],
  "session_id": "optional-session-id"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "response": "AI response",
  "tool_calls": []
}
\`\`\`

### POST /api/tools/search_memories
Search through stored memories

**Request Body:**
\`\`\`json
{
  "query": "search query",
  "limit": 5,
  "threshold": 0.7
}
\`\`\`

### POST /api/tools/create_memory
Create a new memory entry

**Request Body:**
\`\`\`json
{
  "title": "Memory title",
  "content": "Memory content",
  "tags": ["tag1", "tag2"],
  "memory_type": "knowledge"
}
\`\`\`

## WebSocket Events

Connect to \`wss://your-domain.com/ws\` for real-time updates.

### Subscribe to updates:
\`\`\`json
{
  "type": "subscribe",
  "channel": "memories",
  "table": "memory_entries"
}
\`\`\`
`;

  await fs.writeFile(
    join(rootDir, 'API_DOCUMENTATION.md'),
    apiDocs
  );
  
  console.log('✅ Documentation generated');
}

async function showNextSteps() {
  console.log('\n✨ Deployment preparation complete!\n');
  console.log('📋 Next steps:');
  console.log('1. Edit .env.production with your actual values');
  console.log('2. Review hostinger-deployment.md for detailed instructions');
  console.log('3. Set up your Hostinger VPS or Cloud hosting');
  console.log('4. Configure your domain and SSL certificate');
  console.log('5. Deploy using the deployment guide');
  console.log('\n💡 Quick deployment commands:');
  console.log('   scp -r * root@your-server:/var/www/sd-ghost-protocol/');
  console.log('   ssh root@your-server "cd /var/www/sd-ghost-protocol && ./deployment/deploy.sh"');
}

async function main() {
  try {
    await checkEnvironment();
    await buildApplication();
    await prepareMCPServer();
    await createDeploymentPackage();
    await generateDocumentation();
    await showNextSteps();
  } catch (error) {
    console.error('\n❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

main();