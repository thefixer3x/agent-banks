
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  HomeIcon, 
  MessageSquareIcon, 
  DatabaseIcon, 
  BrainIcon, 
  SettingsIcon, 
  ShieldIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MainNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: HomeIcon 
    },
    { 
      path: '/chat', 
      label: 'AI Chat', 
      icon: MessageSquareIcon 
    },
    { 
      path: '/mcp', 
      label: 'Supabase MCP', 
      icon: DatabaseIcon 
    },
    { 
      path: '/memory', 
      label: 'Memory Nexus', 
      icon: BrainIcon 
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: SettingsIcon 
    },
    { 
      path: '/admin', 
      label: 'Admin Panel', 
      icon: ShieldIcon 
    }
  ];

  return (
    <nav className="bg-black/95 backdrop-blur-sm border-b border-orange-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/387154da-ae17-4d3b-82a5-2516cb6d85b2.png" 
              alt="SD Ghost Protocol" 
              className="w-8 h-8 rounded-full object-cover border border-orange-500/50" 
            />
            <span className="text-white font-bold text-lg">Ghost Protocol</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Auth disabled notice */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-300">Auth Disabled</p>
                <p className="text-xs text-gray-400">Development Mode</p>
              </div>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
