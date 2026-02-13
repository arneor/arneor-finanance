'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  Partner,
  Transaction,
  Budget,
  InterPartnerTransfer,
  MonthlySummary,
  Setting,
  PageId,
  Alert,
} from '@/lib/types';
import {
  loadGapiScript,
  loadGisScript,
  initTokenClient,
  requestAccessToken,
  revokeToken,
  initializeSheets,
  fetchAllData,
  clearCache,
} from '@/lib/google-sheets';

interface AppState {
  // Auth
  isLoggedIn: boolean;
  isLoading: boolean;
  authError: string | null;
  // Data
  partners: Partner[];
  transactions: Transaction[];
  budgets: Budget[];
  transfers: InterPartnerTransfer[];
  monthlySummaries: MonthlySummary[];
  settings: Setting[];
  // UI
  currentPage: PageId;
  sidebarOpen: boolean;
  darkMode: boolean;
  alerts: Alert[];
  lastSync: Date | null;
  isSyncing: boolean;
}

interface AppContextType extends AppState {
  login: () => void;
  logout: () => void;
  refreshData: () => Promise<void>;
  setCurrentPage: (page: PageId) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: (id: string) => void;
  setPartners: (partners: Partner[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setTransfers: (transfers: InterPartnerTransfer[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Dark mode persistence - Initialize directly from localStorage to avoid effect
  const [state, setState] = useState<AppState>(() => {
    let initialDarkMode = true;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        try {
          initialDarkMode = JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing dark mode preference", e);
        }
      }
    }

    return {
      isLoggedIn: false,
      isLoading: true,
      authError: null,
      partners: [],
      transactions: [],
      budgets: [],
      transfers: [],
      monthlySummaries: [],
      settings: [],
      currentPage: 'dashboard',
      sidebarOpen: true,
      darkMode: initialDarkMode,
      alerts: [],
      lastSync: null,
      isSyncing: false,
    };
  });

  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const initCalled = useRef(false);

  // Sync dark mode to DOM and LocalStorage whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
    localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
  }, [state.darkMode]);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setState((s) => ({
      ...s,
      alerts: [...s.alerts, { ...alert, id, timestamp: new Date().toISOString() }],
    }));
    setTimeout(() => {
      setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) }));
    }, 5000);
  }, []);

  const refreshData = useCallback(async () => {
    setState((s) => ({ ...s, isSyncing: true }));
    try {
      clearCache();
      const data = await fetchAllData();
      setState((s) => ({
        ...s,
        ...data,
        lastSync: new Date(),
        isSyncing: false,
      }));
    } catch (err) {
      console.error('Refresh failed:', err);
      setState((s) => ({ ...s, isSyncing: false }));
    }
  }, []);


  const onAuthSuccess = useCallback(async () => {
    setState((s) => ({ ...s, isLoggedIn: true, isLoading: true, authError: null }));
    try {
      // 1. Validate Email against Allowlist
      const gapi = (window as any).gapi;
      const userInfoResponse = await gapi.client.request({
        path: 'https://www.googleapis.com/oauth2/v3/userinfo',
      });

      const userEmail = userInfoResponse.result.email;
      const ALLOWED_EMAILS = ['lalnidhinp02@gmail.com', 'Infovahabkp@gmail.com']; // Add more emails here as needed

      if (!ALLOWED_EMAILS.includes(userEmail)) {
        throw new Error(`Access Denied: Email ${userEmail} is not authorized.`);
      }

      await initializeSheets();
      const data = await fetchAllData();

      setState((s) => ({
        ...s,
        ...data,
        isLoading: false,
        lastSync: new Date(),
      }));
      // Auto-refresh every 30 seconds
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      refreshTimer.current = setInterval(refreshData, 30000);


    } catch (err: any) {
      console.error('Init failed detailed:', JSON.stringify(err, null, 2));
      console.error('Init failed original:', err);

      let errorMessage = 'Failed to initialize. Please try again.';
      if (err?.result?.error?.message) {
        if (err.result.error.code === 403) {
          errorMessage = 'Access Denied: You do not have permission to access the Google Sheet. Please ask the owner to share it with your email.';
        } else {
          errorMessage = `API Error: ${err.result.error.message}`;
        }
      } else if (err?.message) {
        if (err.message.includes("403")) {
          errorMessage = 'Access Denied: You do not have permission to access the Google Sheet. Please ask the owner to share it with your email.';
        } else {
          errorMessage = err.message;
        }
      } else if (err?.status === 403) {
        errorMessage = 'Access Denied: You do not have permission to access the Google Sheet. Please ask the owner to share it with your email.';
      }

      // Reset state similar to logout but keep the error
      setState((s) => ({
        ...s,
        isLoading: false,
        authError: errorMessage,
        isLoggedIn: false, // Force back to login screen
        partners: [],
        transactions: [],
        budgets: [],
        transfers: [],
        monthlySummaries: [],
        settings: [],
      }));
      // Clear invalid token
      localStorage.removeItem('gapi_token');
      revokeToken();
    }


  }, [refreshData]);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    (async () => {
      try {
        await Promise.all([loadGapiScript(), loadGisScript()]);
        initTokenClient(onAuthSuccess, (err) => {
          console.error('Auth error:', err);
          setState((s) => ({ ...s, isLoading: false, authError: 'Authentication failed' }));
        });
        setState((s) => ({ ...s, isLoading: false }));
      } catch (err) {
        console.error('Load failed:', err);
        setState((s) => ({ ...s, isLoading: false, authError: 'Failed to load Google APIs' }));
      }
    })();

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [onAuthSuccess]);

  // Effects removed: dark mode initialization now happens in useState

  const login = useCallback(() => {
    try {
      requestAccessToken();
    } catch {
      setState((s) => ({ ...s, authError: 'Please configure Google API credentials' }));
    }
  }, []);

  const logout = useCallback(() => {
    revokeToken();
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    setState((s) => ({
      ...s,
      isLoggedIn: false,
      partners: [],
      transactions: [],
      budgets: [],
      transfers: [],
      monthlySummaries: [],
      settings: [],
    }));
  }, []);

  const contextValue: AppContextType = {
    ...state,
    login,
    logout,
    refreshData,
    setCurrentPage: (page) => setState((s) => ({ ...s, currentPage: page })),
    toggleSidebar: () => setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen })),
    toggleDarkMode: () => setState((s) => ({ ...s, darkMode: !s.darkMode })),
    addAlert,
    dismissAlert: (id) => setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) })),
    setPartners: (partners) => setState((s) => ({ ...s, partners })),
    setTransactions: (transactions) => setState((s) => ({ ...s, transactions })),
    setBudgets: (budgets) => setState((s) => ({ ...s, budgets })),
    setTransfers: (transfers) => setState((s) => ({ ...s, transfers })),
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
