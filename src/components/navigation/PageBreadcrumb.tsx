
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HomeIcon } from 'lucide-react';

const pageNames: Record<string, string> = {
  '/': 'Home',
  '/chat': 'AI Chat',
  '/mcp': 'Supabase MCP',
  '/memory': 'Memory Nexus',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
  '/auth': 'Authentication'
};

const PageBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  if (location.pathname === '/') return null;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1 text-gray-400 hover:text-white">
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {pathSegments.map((segment, index) => {
            const path = '/' + pathSegments.slice(0, index + 1).join('/');
            const isLast = index === pathSegments.length - 1;
            const name = pageNames[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
            
            return (
              <React.Fragment key={path}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-orange-400">{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={path} className="text-gray-400 hover:text-white">
                        {name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default PageBreadcrumb;
