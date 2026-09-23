import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

export const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isLanding = location.pathname === '/';
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password';
  const isLearnPlayer = location.pathname.startsWith('/learn/');
  const isCourseBuilder = location.pathname.startsWith('/creator/courses/');

  const showAppSidebar = Boolean(user) && !isLanding && !isAuthPage;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {showAppSidebar && <Sidebar />}

        <main
          className={`flex-1 overflow-y-auto ${
            isLearnPlayer || isLanding || isAuthPage || isCourseBuilder
              ? 'p-0'
              : 'p-4 sm:p-6 lg:p-8 pb-24 md:pb-10'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {showAppSidebar && <MobileBottomNav />}
    </div>
  );
};