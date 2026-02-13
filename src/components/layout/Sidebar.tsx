'use client';

import React from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { NAV_ITEMS } from '@/lib/constants';
import { PageId } from '@/lib/types';
import {
  LayoutDashboard, ArrowLeftRight, TrendingUp, TrendingDown,
  Users, PieChart, Activity, FileText,
  BarChart3, ClipboardList, Settings, X, CreditCard,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  ArrowLeftRight: <ArrowLeftRight size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  TrendingDown: <TrendingDown size={20} />,
  Users: <Users size={20} />,
  PieChart: <PieChart size={20} />,
  Activity: <Activity size={20} />,
  FileText: <FileText size={20} />,
  BarChart3: <BarChart3 size={20} />,
  ClipboardList: <ClipboardList size={20} />,
  Settings: <Settings size={20} />,
  CreditCard: <CreditCard size={20} />,
};

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar } = useApp();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
              <Image src="/vault-icon.png" alt="Arneor Vault" width={40} height={40} style={{ borderRadius: '10px' }} priority />
            </div>
            <span className="logo-text">Arneor Vault</span>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage(item.id as PageId);
                if (window.innerWidth < 768) toggleSidebar();
              }}
            >
              {iconMap[item.icon]}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
