'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { X } from 'lucide-react';

export function AlertContainer() {
  const { alerts, dismissAlert } = useApp();

  if (alerts.length === 0) return null;

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert alert-${alert.type}`}>
          <div className="alert-content">
            <strong>{alert.title}</strong>
            <p>{alert.message}</p>
          </div>
          <button className="alert-dismiss" onClick={() => dismissAlert(alert.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
