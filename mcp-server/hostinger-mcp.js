#!/usr/bin/env node

/**
 * Hostinger MCP Server - VPS Management via API
 * Provides MCP tools for Hostinger VPS operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';

class HostingerMCPServer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://developers.hostinger.com/api/vps/v1';
    this.server = new Server(
      {
        name: 'hostinger-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  async makeAPIRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseURL);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = body ? JSON.parse(body) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${body}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_vps',
            description: 'List all VPS instances in your Hostinger account',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'get_vps_details',
            description: 'Get detailed information about a specific VPS instance',
            inputSchema: {
              type: 'object',
              properties: {
                vps_id: {
                  type: 'string',
                  description: 'The VPS instance ID'
                }
              },
              required: ['vps_id']
            }
          },
          {
            name: 'create_vps',
            description: 'Create a new VPS instance',
            inputSchema: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  description: 'VPS plan (e.g., vps-1, vps-2)',
                  default: 'vps-1'
                },
                location: {
                  type: 'string',
                  description: 'Server location (e.g., US, EU)',
                  default: 'US'
                },
                os: {
                  type: 'string',
                  description: 'Operating system (e.g., ubuntu-22.04)',
                  default: 'ubuntu-22.04'
                },
                label: {
                  type: 'string',
                  description: 'Custom label for the VPS',
                  default: 'sd-ghost-protocol'
                },
                password: {
                  type: 'string',
                  description: 'Root password for the VPS'
                }
              },
              required: ['password']
            }
          },
          {
            name: 'start_vps',
            description: 'Start a VPS instance',
            inputSchema: {
              type: 'object',
              properties: {
                vps_id: {
                  type: 'string',
                  description: 'The VPS instance ID to start'
                }
              },
              required: ['vps_id']
            }
          },
          {
            name: 'stop_vps',
            description: 'Stop a VPS instance',
            inputSchema: {
              type: 'object',
              properties: {
                vps_id: {
                  type: 'string',
                  description: 'The VPS instance ID to stop'
                }
              },
              required: ['vps_id']
            }
          },
          {
            name: 'restart_vps',
            description: 'Restart a VPS instance',
            inputSchema: {
              type: 'object',
              properties: {
                vps_id: {
                  type: 'string',
                  description: 'The VPS instance ID to restart'
                }
              },
              required: ['vps_id']
            }
          },
          {
            name: 'get_vps_usage',
            description: 'Get resource usage statistics for a VPS',
            inputSchema: {
              type: 'object',
              properties: {
                vps_id: {
                  type: 'string',
                  description: 'The VPS instance ID'
                },
                period: {
                  type: 'string',
                  description: 'Time period (1h, 24h, 7d, 30d)',
                  default: '24h'
                }
              },
              required: ['vps_id']
            }
          },
          {
            name: 'deploy_sd_ghost_protocol',
            description: 'Deploy SD-Ghost Protocol to a VPS instance',
            inputSchema: {
              type: 'object',
              properties: {
                vps_id: {
                  type: 'string',
                  description: 'The VPS instance ID to deploy to'
                },
                domain: {
                  type: 'string',
                  description: 'Optional domain name for the deployment'
                },
                ssl_enabled: {
                  type: 'boolean',
                  description: 'Enable SSL certificate setup',
                  default: true
                }
              },
              required: ['vps_id']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_vps':
            return await this.listVPS();
          
          case 'get_vps_details':
            return await this.getVPSDetails(args.vps_id);
          
          case 'create_vps':
            return await this.createVPS(args);
          
          case 'start_vps':
            return await this.startVPS(args.vps_id);
          
          case 'stop_vps':
            return await this.stopVPS(args.vps_id);
          
          case 'restart_vps':
            return await this.restartVPS(args.vps_id);
          
          case 'get_vps_usage':
            return await this.getVPSUsage(args.vps_id, args.period);
          
          case 'deploy_sd_ghost_protocol':
            return await this.deploySDGhostProtocol(args.vps_id, args.domain, args.ssl_enabled);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async listVPS() {
    try {
      const response = await this.makeAPIRequest('/virtual-machines');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Found ${response.length} VPS instances`,
              vps_instances: response,
              total_count: response.length
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: 'Failed to list VPS instances'
            }, null, 2)
          }
        ]
      };
    }
  }

  async getVPSDetails(vpsId) {
    try {
      const response = await this.makeAPIRequest(`/virtual-machines/${vpsId}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `VPS details for ${vpsId}`,
              vps_details: response
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `Failed to get VPS details for ${vpsId}`
            }, null, 2)
          }
        ]
      };
    }
  }

  async createVPS(config) {
    try {
      const vpsConfig = {
        plan: config.plan || 'vps-1',
        location: config.location || 'US',
        os: config.os || 'ubuntu-22.04',
        label: config.label || 'sd-ghost-protocol',
        password: config.password
      };

      const response = await this.makeAPIRequest('/virtual-machines', 'POST', vpsConfig);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'VPS creation initiated',
              vps_config: vpsConfig,
              response: response,
              next_steps: [
                'Wait 2-5 minutes for VPS to be ready',
                'Use get_vps_details to check status',
                'Use deploy_sd_ghost_protocol to deploy your application'
              ]
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: 'Failed to create VPS'
            }, null, 2)
          }
        ]
      };
    }
  }

  async startVPS(vpsId) {
    try {
      const response = await this.makeAPIRequest(`/virtual-machines/${vpsId}/start`, 'POST');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `VPS ${vpsId} start command sent`,
              response: response
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `Failed to start VPS ${vpsId}`
            }, null, 2)
          }
        ]
      };
    }
  }

  async stopVPS(vpsId) {
    try {
      const response = await this.makeAPIRequest(`/virtual-machines/${vpsId}/stop`, 'POST');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `VPS ${vpsId} stop command sent`,
              response: response
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `Failed to stop VPS ${vpsId}`
            }, null, 2)
          }
        ]
      };
    }
  }

  async restartVPS(vpsId) {
    try {
      const response = await this.makeAPIRequest(`/virtual-machines/${vpsId}/restart`, 'POST');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `VPS ${vpsId} restart command sent`,
              response: response
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `Failed to restart VPS ${vpsId}`
            }, null, 2)
          }
        ]
      };
    }
  }

  async getVPSUsage(vpsId, period = '24h') {
    try {
      const response = await this.makeAPIRequest(`/virtual-machines/${vpsId}/usage?period=${period}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `VPS ${vpsId} usage for ${period}`,
              usage_data: response,
              period: period
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `Failed to get usage data for VPS ${vpsId}`
            }, null, 2)
          }
        ]
      };
    }
  }

  async deploySDGhostProtocol(vpsId, domain = null, sslEnabled = true) {
    try {
      // Get VPS details first
      const vpsDetails = await this.makeAPIRequest(`/virtual-machines/${vpsId}`);
      const vpsIP = vpsDetails.ip_address;

      if (!vpsIP) {
        throw new Error('VPS IP address not found');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'SD-Ghost Protocol deployment instructions generated',
              vps_id: vpsId,
              vps_ip: vpsIP,
              domain: domain,
              ssl_enabled: sslEnabled,
              deployment_steps: [
                `SSH into VPS: ssh root@${vpsIP}`,
                'Run deployment script: curl -sSL https://raw.githubusercontent.com/your-repo/sd-ghost-protocol/main/deployment/install.sh | bash',
                domain ? `Configure domain: ${domain} → ${vpsIP}` : 'Using IP-based deployment',
                sslEnabled && domain ? 'SSL certificate will be automatically configured' : 'SSL disabled or no domain',
                `MCP endpoint will be: ${domain ? `https://${domain}` : `http://${vpsIP}`}/api/chat`
              ],
              manual_deployment_command: `cd /Users/seyederick/CascadeProjects/sd-ghost-protocol/deployment && ./deploy-to-vps.sh ${vpsIP} ${domain || ''}`,
              next_steps: [
                'Ensure VPS is running and accessible via SSH',
                'Run the manual deployment command from your local machine',
                'Test the deployment with health check',
                'Add MCP server to Claude configuration'
              ]
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `Failed to prepare deployment for VPS ${vpsId}`
            }, null, 2)
          }
        ]
      };
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hostinger MCP Server running on stdio');
  }
}

// Start the server
const apiKey = process.env.HOSTINGER_API_KEY || 'YCE1CFqQF4mF0sbZHHCbAMJkYMnWp1vvq7XULUwkc49a3f6e';
const server = new HostingerMCPServer(apiKey);
server.run().catch(console.error);