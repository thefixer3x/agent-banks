
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Database, MessageSquare, Brain, Settings, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="bg-black text-white font-sans flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="text-center max-w-xl">
        <img 
          src="/sd-logo.svg" 
          alt="SD Ghost Protocol" 
          className="mx-auto mb-6 w-24 h-24 rounded-full object-cover opacity-90 shadow-2xl border-2 border-orange-500/50" 
        />
        <h1 className="text-4xl font-bold mb-4">Welcome to SD - Ghost Protocol</h1>
        <p className="text-lg text-gray-300 mb-8">
          Your AI-powered memory nexus. Organize, sync, and collaborate in real time with OpenMemory and Supabase MCP.
        </p>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button 
            onClick={() => navigate('/chat')} 
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center gap-3"
          >
            <MessageSquare className="h-5 w-5" />
            AI Chat Interface
          </Button>
          
          <Button 
            onClick={() => navigate('/mcp')} 
            variant="outline"
            className="border-orange-500/20 hover:border-orange-500/40 py-4 px-6 rounded-xl transition-all flex items-center gap-3"
          >
            <Database className="h-5 w-5" />
            Supabase MCP
          </Button>
          
          <Button 
            onClick={() => navigate('/memory')} 
            variant="outline"
            className="border-orange-500/20 hover:border-orange-500/40 py-4 px-6 rounded-xl transition-all flex items-center gap-3"
          >
            <Brain className="h-5 w-5" />
            Memory Nexus
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button 
            onClick={() => navigate('/settings')} 
            variant="outline"
            size="sm"
            className="border-gray-600 hover:border-gray-500 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          
          {profile?.role === 'admin' && (
            <Button 
              onClick={() => navigate('/admin')} 
              variant="outline"
              size="sm"
              className="border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-400">
          Welcome back, {profile?.full_name || profile?.email}! 
          {profile?.role === 'admin' && " You have admin access."}
        </p>
      </div>

      <footer className="mt-12 text-sm text-gray-600">
        Powered by <strong>The Fixer Initiative</strong> · v0.1 · <a href="https://lanonasis.com" target="_blank" className="underline">Lan Onasis</a>
      </footer>
    </div>
  );
};

export default Index;
