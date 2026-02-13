'use client';

import React from 'react';

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">{text}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  className = '',
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = true,
}: {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill bg-${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="progress-bar-label">{pct.toFixed(0)}%</span>}
    </div>
  );
}
