import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

export const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const mainContentRef = React.useRef(null);

  React.useEffect(() => {
    const mainContent = mainContentRef.current ?? document.getElementById('main-content');

    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const isLanding = location.pathname === '/';
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password';
  const isLearnPlayer = location.pathname.startsWith('/learn/');
  const isCourseBuilder = location.pathname.startsWith('/creator/courses/');

  const isMessages = location.pathname.startsWith('/messages');

  const showAppSidebar = Boolean(user) && !isLanding && !isAuthPage;

  return (
    <div className="h-dvh overflow-hidden bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {showAppSidebar && <Sidebar />}

        <main
          id="main-content"
          ref={mainContentRef}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-y-none ${
            isLearnPlayer || isLanding || isAuthPage || isCourseBuilder
              ? 'p-0'
              : isMessages
              ? 'p-2 sm:p-4 lg:p-6 pb-20 md:pb-6'
              : 'p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-10'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {showAppSidebar && <MobileBottomNav />}
    </div>
  );
};