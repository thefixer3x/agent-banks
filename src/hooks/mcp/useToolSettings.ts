
import { useState, useEffect } from 'react';

interface ToolSettings {
  connectionEnabled: boolean;
  disabledTools: string[];
}

const STORAGE_KEY = 'mcp-tool-settings';

export function useToolSettings() {
  const [settings, setSettings] = useState<ToolSettings>({
    connectionEnabled: true,
    disabledTools: []
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Error parsing MCP tool settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleConnection = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      connectionEnabled: enabled
    }));
  };

  const toggleTool = (toolName: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      disabledTools: enabled
        ? prev.disabledTools.filter(tool => tool !== toolName)
        : [...prev.disabledTools, toolName]
    }));
  };

  const resetSettings = () => {
    setSettings({
      connectionEnabled: true,
      disabledTools: []
    });
  };

  const isToolEnabled = (toolName: string) => {
    return settings.connectionEnabled && !settings.disabledTools.includes(toolName);
  };

  const getEnabledTools = (availableTools: string[]) => {
    if (!settings.connectionEnabled) return [];
    return availableTools.filter(tool => !settings.disabledTools.includes(tool));
  };

  return {
    settings,
    toggleConnection,
    toggleTool,
    resetSettings,
    isToolEnabled,
    getEnabledTools
  };
}
