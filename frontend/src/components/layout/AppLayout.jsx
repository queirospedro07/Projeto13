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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  React.useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const observedElements = new Set();
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        intersectionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    const observeSections = () => {
      mainContent.querySelectorAll('section, article, [data-scroll-reveal]').forEach((element) => {
        if (observedElements.has(element)) return;
        observedElements.add(element);
        element.classList.add('scroll-reveal');
        intersectionObserver.observe(element);
      });
    };

    observeSections();
    const mutationObserver = new MutationObserver(observeSections);
    mutationObserver.observe(mainContent, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [location.pathname]);

  const isLanding = location.pathname === '/';
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password';
  const isLearnPlayer = location.pathname.startsWith('/learn/');
  const isCourseBuilder = location.pathname.startsWith('/creator/courses/');

  const isMessages = location.pathname.startsWith('/messages');

  const showAppSidebar = Boolean(user) && !isLanding && !isAuthPage;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex-1 min-w-0 flex">
        {showAppSidebar && <Sidebar />}

        <main
          id="main-content"
          ref={mainContentRef}
          className={`min-w-0 flex-1 ${
            isLearnPlayer || isLanding || isAuthPage || isCourseBuilder
              ? 'p-0'
              : isMessages
              ? 'p-2 sm:p-4 lg:p-6'
              : 'p-3.5 sm:p-6 lg:p-8'
          }`}
        >
          <div key={location.pathname} className={`route-enter ${showAppSidebar ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>

      {showAppSidebar && <MobileBottomNav />}
    </div>
  );
};