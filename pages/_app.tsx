import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import { Sidebar } from '../components/Sidebar';
import { InventoryProvider } from '../context/InventoryContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

import '../styles/globals.css';

const DynamicTitle = () => {
    const { settings } = useSettings();
    useEffect(() => {
        if (settings.title) {
            document.title = `${settings.title} - Science Laboratory Management`;
        }
    }, [settings.title]);
    return null;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, currentUser, isLoading } = useAuth();
    const router = useRouter();

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
      const handleResize = () => {
        setSidebarCollapsed(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial check
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const publicPages = ['/login', '/signup'];
    // FIX: Corrected path for reports page to include a leading slash for proper route matching.
    const adminPages = ['/log', '/users', '/reports'];

    const isPublicPage = publicPages.includes(router.pathname);
    const isAdminPage = adminPages.some(p => router.pathname.startsWith(p));

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated && !isPublicPage) {
            router.replace('/login');
        } else if (isAuthenticated && isAdminPage && !currentUser?.isAdmin) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, currentUser, isLoading, router, isPublicPage, isAdminPage]);

    if (isPublicPage || (!isAuthenticated && !isLoading)) {
        return <>{children}</>;
    }

    if(isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <div className="flex">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
            <main className={`flex-1 min-h-screen main-content-print bg-slate-900 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {children}
            </main>
            <div id="qr-print-area" className="qr-modal-print-container"></div>
        </div>
    );
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SettingsProvider>
      <InventoryProvider>
        <AuthProvider>
          <DynamicTitle />
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        </AuthProvider>
      </InventoryProvider>
    </SettingsProvider>
  );
}

export default MyApp;
