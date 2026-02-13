'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Menu, RefreshCw, Sun, Moon, Bell, LogOut, User,
} from 'lucide-react';

export default function Header() {
  const {
    toggleSidebar, toggleDarkMode, darkMode, refreshData,
    isSyncing, lastSync, alerts, isLoggedIn, logout, currentPage,
  } = useApp();

  const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1');

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-btn menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="header-title">{pageTitle === 'Pnl' ? 'P&L Statement' : pageTitle}</h1>
          <p className="header-subtitle text-xs text-muted-foreground hidden md:block">Arneor Labs Internal System</p>
        </div>
      </div>

      <div className="header-right">
        {lastSync && (
          <span className="sync-time">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        )}

        <button
          className={`header-btn ${isSyncing ? 'spinning' : ''}`}
          onClick={refreshData}
          disabled={isSyncing}
          title="Refresh data"
        >
          <RefreshCw size={18} />
        </button>

        <button className="header-btn" onClick={toggleDarkMode} title="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="notification-wrapper">
          <button className="header-btn" title="Alerts">
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="notification-badge">{alerts.length}</span>
            )}
          </button>
        </div>

        {isLoggedIn && (
          <>
            <div className="header-divider" />
            <button className="header-btn user-btn" title="Account">
              <User size={18} />
            </button>
            <button className="header-btn logout-btn" onClick={logout} title="Sign out">
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
