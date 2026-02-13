'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import { updateSetting } from '@/lib/google-sheets';
import { Save, ExternalLink } from 'lucide-react';
import { SPREADSHEET_ID } from '@/lib/constants'; 

export default function SettingsPage() {
  const { settings, refreshData, addAlert } = useApp();
  const [saving, setSaving] = useState(false);

  const getSetting = (name: string) => settings.find((s) => s.Setting_Name === name)?.Setting_Value || '';

  const [form, setForm] = useState({
    Company_Name: getSetting('Company_Name') || 'My Startup',
    Currency: getSetting('Currency') || 'INR',
    Financial_Year_Start: getSetting('Financial_Year_Start') || 'April',
    Tax_Rate: getSetting('Tax_Rate') || '18',
    Low_Balance_Threshold: getSetting('Low_Balance_Threshold') || '50000',
    Auto_Refresh_Interval: getSetting('Auto_Refresh_Interval') || '30',
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings.length > 0) {
      setForm({
        Company_Name: getSetting('Company_Name') || 'My Startup',
        Currency: getSetting('Currency') || 'INR',
        Financial_Year_Start: getSetting('Financial_Year_Start') || 'April',
        Tax_Rate: getSetting('Tax_Rate') || '18',
        Low_Balance_Threshold: getSetting('Low_Balance_Threshold') || '50000',
        Auto_Refresh_Interval: getSetting('Auto_Refresh_Interval') || '30',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(form)) {
        await updateSetting(key, value);
      }
      addAlert({ type: 'success', title: 'Saved', message: 'Settings updated successfully' });
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to save settings' });
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="page-content">
      <div className="settings-header">
        <h2 className="section-title">System Configuration</h2>
        <a
          href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          <ExternalLink size={16} /> Open Arneor Database (Sheets)
        </a>
      </div>

      <div className="settings-grid">
        <Card title="Arneor Labs Profile">
          <div className="form-grid">
            <div className="form-group span-2">
              <label>Company Name</label>
              <input type="text" value={form.Company_Name} onChange={(e) => setForm((f) => ({ ...f, Company_Name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select value={form.Currency} onChange={(e) => setForm((f) => ({ ...f, Currency: e.target.value }))}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Financial Year Start</label>
              <select value={form.Financial_Year_Start} onChange={(e) => setForm((f) => ({ ...f, Financial_Year_Start: e.target.value }))}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Financial Thresholds & ALerting">
          <div className="form-grid">
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input type="number" step="0.1" value={form.Tax_Rate} onChange={(e) => setForm((f) => ({ ...f, Tax_Rate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Low Balance Alert Threshold</label>
              <input type="number" value={form.Low_Balance_Threshold} onChange={(e) => setForm((f) => ({ ...f, Low_Balance_Threshold: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Auto-Refresh Interval (seconds)</label>
              <input type="number" value={form.Auto_Refresh_Interval} min="10" max="300" onChange={(e) => setForm((f) => ({ ...f, Auto_Refresh_Interval: e.target.value }))} />
            </div>
          </div>
        </Card>

        <Card title="Arneor Database Connection">
          <div className="connection-info">
            <div className="connection-row">
              <span className="connection-label">Spreadsheet ID</span>
              <code className="connection-value">{SPREADSHEET_ID}</code>
            </div>
            <div className="connection-row">
              <span className="connection-label">Status</span>
              <span className="connection-status connected">Connected</span>
            </div>
          </div>
        </Card>

        <Card title="Setup Guide">
          <div className="setup-guide">
            <h4>Getting Started</h4>
            <ol>
              <li>Create a Google Cloud project at <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a></li>
              <li>Enable the Google Sheets API</li>
              <li>Create OAuth 2.0 credentials (Web application type)</li>
              <li>Set authorized JS origins to your app URL</li>
              <li>Add your Client ID and API Key to <code>.env.local</code>:
                <pre>{`NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key`}</pre>
              </li>
              <li>Restart the development server</li>
              <li>Click &quot;Sign In with Google&quot; to authenticate</li>
            </ol>
          </div>
        </Card>
      </div>

      <div className="settings-save">
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
