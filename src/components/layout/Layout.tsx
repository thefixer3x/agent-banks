
import React from 'react';
import MainNavigation from '../navigation/MainNavigation';
import PageBreadcrumb from '../navigation/PageBreadcrumb';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showBreadcrumb?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showNavigation = true, 
  showBreadcrumb = true 
}) => {
  return (
    <div className="min-h-screen bg-black text-white">
      {showNavigation && <MainNavigation />}
      {showNavigation && showBreadcrumb && <PageBreadcrumb />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
