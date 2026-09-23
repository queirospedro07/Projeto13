import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { CommandPalette } from './CommandPalette';

export const AppLayout: React.FC = () => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Certain pages have custom full-width / full-screen layouts
  const isLanding = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
  const isLearnPlayer = location.pathname.startsWith('/learn/');
  const isChatOnly = location.pathname.includes('/chat');
  const isCourseBuilder = location.pathname.startsWith('/creator/courses/');

  const showAppSidebar = Boolean(user) && !isLanding && !isAuthPage;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col transition-colors duration-200">
      {/* Global Navbar */}
      <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar only for authenticated users on app pages */}
        {showAppSidebar && <Sidebar />}

        {/* Dynamic Route Content */}
        <main className={`flex-1 overflow-y-auto ${
          isLearnPlayer || isChatOnly || isLanding || isAuthPage || isCourseBuilder
            ? 'p-0' 
            : 'p-6 sm:p-8 lg:p-10 pb-24 md:pb-10'
        }`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation only for authenticated users */}
      {showAppSidebar && <MobileBottomNav />}

      {/* Global Command Palette (only when logged in) */}
      {user && <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />}
    </div>
  );
};
