import { useState, useCallback, useRef } from 'react';
import { useMemoryAwareChat } from './useMemoryAwareChat';
import { useServiceIntegration } from './useServiceIntegration';
import { toast } from '@/hooks/use-toast';

export interface ServiceCommand {
  id: string;
  command: string;
  service: 'clickup' | 'telegram' | 'database' | 'picaos';
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export function useServiceAwareChat() {
  const memoryChat = useMemoryAwareChat();
  const serviceIntegration = useServiceIntegration();
  const [detectedCommands, setDetectedCommands] = useState<ServiceCommand[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // Parse message for service commands
  const parseServiceCommands = useCallback((message: string): ServiceCommand[] => {
    const commands: ServiceCommand[] = [];
    
    // ClickUp command patterns
    const clickupPatterns = [
      /create task "([^"]+)" in list (\w+)/i,
      /add task "([^"]+)" to (\w+)/i,
      /get tasks from list (\w+)/i,
      /show tasks in (\w+)/i,
      /update task (\w+) set (.+)/i
    ];
    
    // Telegram command patterns
    const telegramPatterns = [
      /send message "([^"]+)" to chat (\w+)/i,
      /telegram send "([^"]+)" to (\w+)/i,
      /get telegram updates/i,
      /send photo (\S+) to chat (\w+)/i
    ];
    
    // Picaos command patterns
    const picaosPatterns = [
      /picaos list tools(?: in category "([^"]+)")?/i,
      /picaos search (?:for )?tools (?:that )?"([^"]+)"/i,
      /picaos (?:run|execute) tool "([^"]+)" with (.+)/i,
      /picaos get schema for "([^"]+)"/i,
      /picaos create workflow "([^"]+)" with steps (.+)/i,
      /picaos (?:run|execute) workflow "([^"]+)"(?: with (.+))?/i,
      /picaos (?:check|get) status (?:of|for) execution "([^"]+)"/i,
      /find picaos tools (?:for|that) (.+)/i
    ];
    
    // Database command patterns
    const databasePatterns = [
      /search memories for "([^"]+)"/i,
      /find memories about (.+)/i,
      /create memory "([^"]+)" with content "([^"]+)"/i,
      /save memory "([^"]+)": "([^"]+)"/i,
      /get memory stats/i
    ];

    // Check ClickUp patterns
    clickupPatterns.forEach((pattern, index) => {
      const match = message.match(pattern);
      if (match) {
        let action = '';
        let parameters = {};
        
        switch (index) {
          case 0:
          case 1:
            action = 'create_task';
            parameters = { name: match[1], list_id: match[2] };
            break;
          case 2:
          case 3:
            action = 'get_tasks';
            parameters = { list_id: match[1] };
            break;
          case 4:
            action = 'update_task';
            parameters = { task_id: match[1], updates: match[2] };
            break;
        }
        
        commands.push({
          id: crypto.randomUUID(),
          command: match[0],
          service: 'clickup',
          action,
          parameters,
          status: 'pending'
        });
      }
    });
    
    // Check Telegram patterns
    telegramPatterns.forEach((pattern, index) => {
      const match = message.match(pattern);
      if (match) {
        let action = '';
        let parameters = {};
        
        switch (index) {
          case 0:
          case 1:
            action = 'send_message';
            parameters = { text: match[1], chat_id: match[2] };
            break;
          case 2:
            action = 'get_updates';
            parameters = {};
            break;
          case 3:
            action = 'send_photo';
            parameters = { photo: match[1], chat_id: match[2] };
            break;
        }
        
        commands.push({
          id: crypto.randomUUID(),
          command: match[0],
          service: 'telegram',
          action,
          parameters,
          status: 'pending'
        });
      }
    });
    
    // Check Picaos patterns
    picaosPatterns.forEach((pattern, index) => {
      const match = message.match(pattern);
      if (match) {
        let action = '';
        let parameters: Record<string, any> = {};
        
        switch (index) {
          case 0:
            action = 'list_tools';
            parameters = { category: match[1] || undefined };
            break;
          case 1:
            action = 'search_tools';
            parameters = { query: match[1] };
            break;
          case 2:
            action = 'execute_tool';
            try {
              const params = JSON.parse(match[2]);
              parameters = { tool_name: match[1], parameters: params };
            } catch {
              parameters = { tool_name: match[1], parameters: { input: match[2] } };
            }
            break;
          case 3:
            action = 'get_tool_schema';
            parameters = { tool_name: match[1] };
            break;
          case 4:
            action = 'create_workflow';
            try {
              const steps = JSON.parse(match[2]);
              parameters = { workflow_name: match[1], steps };
            } catch {
              parameters = { workflow_name: match[1], steps: [{ description: match[2] }] };
            }
            break;
          case 5:
            action = 'execute_workflow';
            parameters = { workflow_id: match[1] };
            if (match[2]) {
              try {
                parameters.input_data = JSON.parse(match[2]);
              } catch {
                parameters.input_data = { input: match[2] };
              }
            }
            break;
          case 6:
            action = 'get_execution_status';
            parameters = { execution_id: match[1] };
            break;
          case 7:
            action = 'search_tools';
            parameters = { query: match[1] };
            break;
        }
        
        commands.push({
          id: crypto.randomUUID(),
          command: match[0],
          service: 'picaos',
          action,
          parameters,
          status: 'pending'
        });
      }
    });
    
    // Check database patterns
    databasePatterns.forEach((pattern, index) => {
      const match = message.match(pattern);
      if (match) {
        let action = '';
        let parameters = {};
        
        switch (index) {
          case 0:
            action = 'search_memories';
            parameters = { query: match[1] };
            break;
          case 1:
            action = 'search_memories';
            parameters = { query: match[1] };
            break;
          case 2:
            action = 'create_memory';
            parameters = { title: match[1], content: match[2] };
            break;
          case 3:
            action = 'create_memory';
            parameters = { title: match[1], content: match[2] };
            break;
          case 4:
            action = 'get_memory_stats';
            parameters = {};
            break;
        }
        
        commands.push({
          id: crypto.randomUUID(),
          command: match[0],
          service: 'database',
          action,
          parameters,
          status: 'pending'
        });
      }
    });
    
    return commands;
  }, []);

  // Execute service commands
  const executeServiceCommands = useCallback(async (commands: ServiceCommand[]) => {
    if (commands.length === 0) return [];
    
    setIsProcessingCommand(true);
    const results = [];
    
    for (const command of commands) {
      try {
        setDetectedCommands(prev => 
          prev.map(cmd => 
            cmd.id === command.id 
              ? { ...cmd, status: 'executing' as const }
              : cmd
          )
        );
        
        let result;
        const toolName = `${command.service}_${command.action}`;
        
        switch (command.service) {
          case 'clickup':
            result = await serviceIntegration.executeMCPTool(toolName, command.parameters);
            break;
          case 'telegram':
            result = await serviceIntegration.executeMCPTool(toolName, command.parameters);
            break;
          case 'picaos':
            result = await serviceIntegration.executeMCPTool(toolName, command.parameters);
            break;
          case 'database':
            result = await serviceIntegration.executeMCPTool(toolName, command.parameters);
            break;
        }
        
        setDetectedCommands(prev => 
          prev.map(cmd => 
            cmd.id === command.id 
              ? { ...cmd, status: 'completed' as const, result }
              : cmd
          )
        );
        
        results.push({ command, result });
      } catch (error) {
        setDetectedCommands(prev => 
          prev.map(cmd => 
            cmd.id === command.id 
              ? { ...cmd, status: 'failed' as const, error: error.message }
              : cmd
          )
        );
        
        results.push({ command, error: error.message });
      }
    }
    
    setIsProcessingCommand(false);
    return results;
  }, [serviceIntegration]);

  // Enhanced send message that processes service commands
  const sendMessage = useCallback(async (content: string) => {
    // Parse for service commands
    const commands = parseServiceCommands(content);
    
    if (commands.length > 0) {
      setDetectedCommands(prev => [...commands, ...prev]);
      
      // Execute the commands
      const commandResults = await executeServiceCommands(commands);
      
      // Format results for the AI response
      const commandSummary = commandResults.map(({ command, result, error }) => {
        if (error) {
          return `❌ ${command.command}: ${error}`;
        } else {
          return `✅ ${command.command}: Completed successfully`;
        }
      }).join('\n');
      
      // Send the original message plus command results to AI
      const enhancedContent = `${content}\n\n[Service Actions Executed]\n${commandSummary}`;
      
      return memoryChat.sendMessage(enhancedContent);
    } else {
      // No service commands detected, proceed with normal chat
      return memoryChat.sendMessage(content);
    }
  }, [memoryChat.sendMessage, parseServiceCommands, executeServiceCommands]);

  // Clear detected commands
  const clearCommands = useCallback(() => {
    setDetectedCommands([]);
  }, []);

  return {
    ...memoryChat,
    sendMessage, // Override with service-aware version
    detectedCommands,
    isProcessingCommand,
    serviceActions: serviceIntegration.serviceActions,
    clearCommands,
    clearServiceActions: serviceIntegration.clearActions,
    
    // Expose service integration for manual use
    services: {
      clickup: serviceIntegration.clickup,
      telegram: serviceIntegration.telegram,
      picaos: serviceIntegration.picaos,
      database: serviceIntegration.database
    }
  };
}
