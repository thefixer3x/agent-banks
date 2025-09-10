
import { useState, useCallback } from 'react';
import { MCPServerState } from './types';
import { showToast } from './utils';

export function useServerState() {
  const [state, setState] = useState<MCPServerState>({
    status: 'connecting',
    uptime: 0,
    memory: 0,
    cpu: 0,
  });
  const [isConnecting, setIsConnecting] = useState(true);
  const [uptimeInterval, setUptimeInterval] = useState<number | null>(null);

  // Function to start the uptime counter
  const startUptimeCounter = useCallback(() => {
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
    }
    
    let seconds = 0;
    const interval = window.setInterval(() => {
      seconds++;
      setState(prev => ({
        ...prev,
        uptime: seconds
      }));
    }, 1000);
    
    setUptimeInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Update server state
  const updateServerStatus = useCallback((status: 'online' | 'offline' | 'connecting') => {
    setState(prev => ({ ...prev, status }));
  }, []);

  // Update system stats to simulate activity
  const updateSystemStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      memory: Math.min(95, prev.memory + Math.floor(Math.random() * 5)),
      cpu: Math.min(95, prev.cpu + Math.floor(Math.random() * 10))
    }));
    
    // Gradually decrease stats over time
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        memory: Math.max(20, prev.memory - Math.floor(Math.random() * 8)),
        cpu: Math.max(10, prev.cpu - Math.floor(Math.random() * 12))
      }));
    }, 5000);
  }, []);

  // Restart the MCP server
  const restartServer = async () => {
    updateServerStatus('connecting');
    
    try {
      // Simulate server restart
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset uptime and adjust stats
      setState({
        status: 'online',
        uptime: 0,
        memory: Math.max(10, state.memory - 10),
        cpu: Math.max(5, state.cpu - 10),
      });
      
      // Restart the uptime counter
      startUptimeCounter();
      
      showToast(
        "Server Restarted",
        "MCP Server has been restarted successfully"
      );
      
      return true;
    } catch (error) {
      console.error("Error restarting MCP server:", error);
      
      showToast(
        "Restart Failed",
        "Failed to restart the MCP server",
        "destructive"
      );
      
      return false;
    }
  };

  return {
    state,
    isConnecting,
    setIsConnecting,
    updateServerStatus,
    updateSystemStats,
    startUptimeCounter,
    restartServer,
    cleanupUptimeCounter: () => {
      if (uptimeInterval) {
        clearInterval(uptimeInterval);
      }
    }
  };
}
