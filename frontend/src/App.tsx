import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { BuyerOnboardingWizard } from './components/modules/BuyerOnboardingWizard';
import { ManufacturerOnboardingWizard } from './components/modules/ManufacturerOnboardingWizard';

export type AppPage = 'landing' | 'login' | 'dashboard' | 'buyer-register' | 'mfg-register';

const AppContent: React.FC = () => {
  const { isAuthenticated, currentRole } = useApp();

  const isDashboardRoute = (path: string) => {
    return path === '/buyer' || path.startsWith('/buyer') ||
      path === '/supplier' || path.startsWith('/supplier') ||
      path === '/compliance' || path.startsWith('/compliance') ||
      path === '/sales' || path.startsWith('/sales') ||
      path === '/accounts' || path.startsWith('/accounts') ||
      path === '/admin' || path.startsWith('/admin') ||
      path === '/dashboard' || path.startsWith('/dashboard');
  };

  const getInitialPage = (): AppPage => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/';
    if (path === '/signin' || path === '/login') {
      return 'login';
    }
    if (isDashboardRoute(path)) {
      return 'dashboard';
    }
    if (path === '/buyer-register') return 'buyer-register';
    if (path === '/mfg-register') return 'mfg-register';

    // Root URL "/" always renders Public Landing Page
    return 'landing';
  };

  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/signin' || path === '/login') {
        setCurrentPage('login');
      } else if (isDashboardRoute(path)) {
        if (isAuthenticated) {
          setCurrentPage('dashboard');
        } else {
          window.history.replaceState({}, '', '/signin');
          setCurrentPage('login');
        }
      } else if (path === '/buyer-register') {
        setCurrentPage('buyer-register');
      } else if (path === '/mfg-register') {
        setCurrentPage('mfg-register');
      } else {
        setCurrentPage('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const navigate = (page: string, overrideRole?: string) => {
    let targetPage = page as AppPage;
    let targetPath = '/';

    if (targetPage === 'landing') {
      targetPath = '/';
    } else if (targetPage === 'login') {
      targetPath = '/signin';
    } else if (targetPage === 'dashboard') {
      const savedRole = (typeof window !== 'undefined' ? localStorage.getItem('fg_role') : null) as any;
      const effectiveRole = overrideRole || savedRole || currentRole;
      const authed = isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('fg_auth') === 'true');

      if (authed) {
        if (effectiveRole === 'COMPLIANCE_OFFICER') targetPath = '/compliance';
        else if (effectiveRole === 'SALES_MANAGER') targetPath = '/sales';
        else if (effectiveRole === 'ACCOUNTS_MANAGER') targetPath = '/accounts';
        else if (effectiveRole === 'ADMIN') targetPath = '/admin';
        else if (effectiveRole === 'SUPPLIER') targetPath = '/supplier';
        else if (effectiveRole === 'BUYER') targetPath = '/buyer';
        else targetPath = '/admin';
      } else {
        targetPage = 'login';
        targetPath = '/signin';
      }
    } else if (targetPage === 'buyer-register') {
      targetPath = '/buyer-register';
    } else if (targetPage === 'mfg-register') {
      targetPath = '/mfg-register';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentPage(targetPage);
  };

  return (
    <>
      {currentPage === 'landing' && <LandingPage onNavigate={navigate} />}
      {currentPage === 'buyer-register' && (
        <div style={{ minHeight: '100vh', background: '#07111D', color: '#fff' }}>
          <header style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(7,17,29,0.95)' }}>
            <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', color: '#FFF', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '4px 8px', borderRadius: 6, background: '#3B82F6', fontSize: 12 }}>FG</span> Buyer Registration Desk
            </button>
            <button onClick={() => navigate('landing')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>
              ← Return to Home
            </button>
          </header>
          <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
            <BuyerOnboardingWizard isPublicPage onBack={() => navigate('landing')} />
          </div>
        </div>
      )}
      {currentPage === 'mfg-register' && (
        <div style={{ minHeight: '100vh', background: '#07111D', color: '#fff' }}>
          <header style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(7,17,29,0.95)' }}>
            <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', color: '#FFF', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '4px 8px', borderRadius: 6, background: '#14B8A6', fontSize: 12 }}>FG</span> Manufacturer Verification Portal
            </button>
            <button onClick={() => navigate('landing')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>
              ← Return to Home
            </button>
          </header>
          <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
            <ManufacturerOnboardingWizard isPublicPage onBack={() => navigate('landing')} />
          </div>
        </div>
      )}
      {currentPage === 'login' && <LoginPage onNavigate={navigate} />}
      {currentPage === 'dashboard' && (
        isAuthenticated ? (
          <DashboardLayout onNavigate={navigate} />
        ) : (
          <LoginPage onNavigate={navigate} />
        )
      )}
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
