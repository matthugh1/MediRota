import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';
import { ScopeDropdown } from '../../../components/ScopeDropdown.js';
import { Breadcrumb } from '../../../components/Breadcrumb.js';
import { sidebarVariants, pageVariants, pageTransition } from '../../../lib/motion';

const PlannerLayout: React.FC = () => {
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('planner:navCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !navCollapsed) {
        setNavCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount

    return () => window.removeEventListener('resize', handleResize);
  }, [navCollapsed]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('planner:navCollapsed', JSON.stringify(navCollapsed));
  }, [navCollapsed]);

  // Keyboard shortcuts
  useHotkeys('[', () => setNavCollapsed(true), { preventDefault: true });
  useHotkeys(']', () => setNavCollapsed(false), { preventDefault: true });
  useHotkeys('g d', () => {
    // Navigate to Demand Builder
    window.location.href = '/planner/demand';
  }, { preventDefault: true });
  useHotkeys('g s', () => {
    // Navigate to Schedule
    window.location.href = '/planner/schedule';
  }, { preventDefault: true });
  useHotkeys('f', () => {
    // Focus search
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, { preventDefault: true });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Grid Layout */}
      <div className="grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] h-screen">
        {/* Sidebar */}
        <motion.aside
          className="row-span-2 bg-white border-r border-neutral-200"
          initial={false}
          animate={navCollapsed ? 'closed' : 'open'}
          variants={sidebarVariants}
          aria-label="Navigation sidebar"
        >
          <SidebarNav 
            collapsed={navCollapsed} 
            onToggle={() => setNavCollapsed(!navCollapsed)} 
          />
        </motion.aside>

        {/* Top Bar */}
        <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-neutral-200 z-10">
          <TopBar navCollapsed={navCollapsed} />
          <ScopeDropdown />
          <Breadcrumb />
        </header>

        {/* Main Content */}
        <main className="overflow-auto scrollbar-thin">
          <div className="p-6 xl:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={pageTransition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlannerLayout;
