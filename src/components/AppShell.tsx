'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

import { AlertContainer } from '@/components/ui/AlertContainer';
import { LoadingSpinner } from '@/components/ui/SharedComponents';
import LoginPage from '@/components/pages/LoginPage';
import DashboardPage from '@/components/pages/DashboardPage';
import TransactionsPage from '@/components/pages/TransactionsPage';
import IncomePage from '@/components/pages/IncomePage';
import ExpensesPage from '@/components/pages/ExpensesPage';
import PartnersPage from '@/components/pages/PartnersPage';
import BudgetsPage from '@/components/pages/BudgetsPage';
import CashFlowPage from '@/components/pages/CashFlowPage';
import PnLPage from '@/components/pages/PnLPage';
import AnalyticsPage from '@/components/pages/AnalyticsPage';
import ReportsPage from '@/components/pages/ReportsPage';

import SettingsPage from '@/components/pages/SettingsPage';

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  transactions: TransactionsPage,
  income: IncomePage,
  expenses: ExpensesPage,
  partners: PartnersPage,
  budgets: BudgetsPage,
  cashflow: CashFlowPage,
  pnl: PnLPage,
  analytics: AnalyticsPage,
  reports: ReportsPage,
  settings: SettingsPage,

};

export default function AppShell() {
  const { isLoggedIn, isLoading, currentPage, sidebarOpen } = useApp();

  if (!isLoggedIn) {
    if (isLoading) {
      return (
        <div className="app-loading">
          <LoadingSpinner text="Initializing Arneor Vault..." />
        </div>
      );
    }
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner text="Loading financial data..." />
      </div>
    );
  }

  const PageComponent = pageComponents[currentPage] || DashboardPage;

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="main-area flex flex-col min-h-0 overflow-y-auto">
          <div className="flex-1 p-6">
            <PageComponent />
          </div>

        </main>
      </div>
      <AlertContainer />
    </div>
  );
}
