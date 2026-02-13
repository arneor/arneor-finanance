'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
}

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: MetricCardProps) {
  return (
    <div className={`metric-card metric-${color}`}>
      <div className="metric-card-header">
        <div className="metric-info">
          <span className="metric-title">{title}</span>
          <span className="metric-value">{value}</span>
          {subtitle && <span className="metric-subtitle">{subtitle}</span>}
        </div>
        <div className={`metric-icon-wrap bg-${color}`}>
          <Icon size={22} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`metric-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%</span>
          <span className="trend-label">vs last month</span>
        </div>
      )}
    </div>
  );
}
