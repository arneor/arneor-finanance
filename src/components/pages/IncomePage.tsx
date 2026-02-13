'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import Modal from '@/components/ui/Modal';
import { addTransaction, updateTransaction } from '@/lib/google-sheets';
import { INCOME_CATEGORIES, PAYMENT_METHODS, CURRENCY_SYMBOL, CHART_COLORS, CHART_PALETTE } from '@/lib/constants';
import { formatCurrency, formatDate, today, getCategoryBreakdown, getMonthlyData } from '@/lib/utils';
import { Plus, ArrowUpRight, Edit2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function IncomePage() {
  const { transactions, partners, refreshData, addAlert } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ Date: today(), Category: '', Amount: '', Partner_Account: '', Description: '', Payment_Method: 'Bank Transfer', Tags: '', Added_By: '' });

  const incomeTransactions = useMemo(() => transactions.filter((t) => t.Type === 'Income' && t.Transaction_ID).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()), [transactions]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions, 'Income'), [transactions]);
  const monthlyData = useMemo(() => getMonthlyData(transactions, 6), [transactions]);
  const totalIncome = incomeTransactions.reduce((s, t) => s + t.Amount, 0);

  const handleAdd = async () => {
    if (!form.Category || !form.Amount || !form.Partner_Account) return;
    setSubmitting(true);
    try {
      await addTransaction({ Date: form.Date, Type: 'Income', Category: form.Category, Amount: parseFloat(form.Amount), Partner_Account: form.Partner_Account, Description: form.Description, Payment_Method: form.Payment_Method, Tags: form.Tags, Added_By: form.Added_By });
      addAlert({ type: 'success', title: 'Added', message: 'Income recorded' });
      setShowAdd(false);
      setForm({ Date: today(), Category: '', Amount: '', Partner_Account: '', Description: '', Payment_Method: 'Bank Transfer', Tags: '', Added_By: '' });
      await refreshData();
    } catch { addAlert({ type: 'danger', title: 'Error', message: 'Failed' }); }
    setSubmitting(false);
  };

  const handleEdit = (t: typeof incomeTransactions[0]) => {
    setEditTxId(t.Transaction_ID);
    setForm({ Date: t.Date, Category: t.Category, Amount: t.Amount.toString(), Partner_Account: t.Partner_Account, Description: t.Description, Payment_Method: t.Payment_Method, Tags: t.Tags, Added_By: t.Added_By });
    setShowEdit(true);
  };

  const handleEditSubmit = async () => {
    if (!form.Category || !form.Amount || !form.Partner_Account || !editTxId) return;
    setSubmitting(true);
    try {
      const realIndex = transactions.findIndex((t) => t.Transaction_ID === editTxId);
      if (realIndex === -1) throw new Error('Transaction not found');
      const existing = transactions[realIndex];
      await updateTransaction(realIndex, { ...existing, Date: form.Date, Type: 'Income', Category: form.Category, Amount: parseFloat(form.Amount), Partner_Account: form.Partner_Account, Description: form.Description, Payment_Method: form.Payment_Method, Tags: form.Tags, Added_By: form.Added_By });
      addAlert({ type: 'success', title: 'Updated', message: 'Income transaction updated' });
      setShowEdit(false);
      setEditTxId(null);
      setForm({ Date: today(), Category: '', Amount: '', Partner_Account: '', Description: '', Payment_Method: 'Bank Transfer', Tags: '', Added_By: '' });
      await refreshData();
    } catch { addAlert({ type: 'danger', title: 'Error', message: 'Failed to update' }); }
    setSubmitting(false);
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'rgba(255,255,255,0.7)' } }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 12, cornerRadius: 8 } }, scales: { x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.06)' } }, y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.06)' } } } };

  return (
    <div className="page-content">
      <div className="page-header-bar">
        <div><h2 className="page-subtitle">Total Revenue</h2><p className="page-big-value amount-positive">{formatCurrency(totalIncome)}</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Record Revenue</button>
      </div>

      <div className="charts-grid grid-2">
        <Card title="Revenue Trend" className="chart-card">
          <div className="chart-container">
            <Line data={{ labels: monthlyData.labels, datasets: [{ label: 'Revenue', data: monthlyData.revenue, borderColor: CHART_COLORS.success, backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }] }} options={chartOpts} />
          </div>
        </Card>
        <Card title="Income Sources" className="chart-card">
          <div className="chart-container-sm">
            {breakdown.labels.length > 0 ? <Doughnut data={{ labels: breakdown.labels, datasets: [{ data: breakdown.values, backgroundColor: CHART_PALETTE, borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', usePointStyle: true } } } }} /> : <p className="no-data-text">No data</p>}
          </div>
        </Card>
      </div>

      <Card title="Income Transactions">
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Partner</th><th>Description</th><th>Payment</th><th>Actions</th></tr></thead>
            <tbody>
              {incomeTransactions.length === 0 ? <tr><td colSpan={8} className="no-data-cell">No income recorded</td></tr> :
                incomeTransactions.slice(0, 50).map((t) => (
                  <tr key={t.Transaction_ID}>
                    <td>{formatDate(t.Date)}</td>
                    <td>{t.Category}</td>
                    <td className="amount-positive"><ArrowUpRight size={14} /> {formatCurrency(t.Amount)}</td>
                    <td>{partners.find((p) => p.Partner_ID === t.Partner_Account)?.Partner_Name || t.Partner_Account}</td>
                    <td className="desc-cell">{t.Description}</td>
                    <td>{t.Payment_Method}</td>
                    <td>
                      <div className="action-cell">
                        <button className="icon-btn" title="Edit" onClick={() => handleEdit(t)}><Edit2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Income" size="lg">
        <div className="form-grid">
          <div className="form-group"><label>Date</label><input type="date" value={form.Date} onChange={(e) => setForm((f) => ({ ...f, Date: e.target.value }))} /></div>
          <div className="form-group"><label>Category *</label><select value={form.Category} onChange={(e) => setForm((f) => ({ ...f, Category: e.target.value }))}><option value="">Select</option>{INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="form-group"><label>Amount ({CURRENCY_SYMBOL}) *</label><input type="number" step="0.01" value={form.Amount} onChange={(e) => setForm((f) => ({ ...f, Amount: e.target.value }))} /></div>
          <div className="form-group"><label>Received By Partner *</label><select value={form.Partner_Account} onChange={(e) => setForm((f) => ({ ...f, Partner_Account: e.target.value }))}><option value="">Select</option>{partners.map((p) => <option key={p.Partner_ID} value={p.Partner_ID}>{p.Partner_Name}</option>)}</select></div>
          <div className="form-group span-2"><label>Description</label><input type="text" value={form.Description} onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))} /></div>
          <div className="form-group"><label>Payment Method</label><select value={form.Payment_Method} onChange={(e) => setForm((f) => ({ ...f, Payment_Method: e.target.value }))}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
          <div className="form-group"><label>Added By</label><input type="text" value={form.Added_By} onChange={(e) => setForm((f) => ({ ...f, Added_By: e.target.value }))} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>{submitting ? 'Adding...' : 'Add Income'}</button>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditTxId(null); }} title="Edit Income" size="lg">
        <div className="form-grid">
          <div className="form-group"><label>Date</label><input type="date" value={form.Date} onChange={(e) => setForm((f) => ({ ...f, Date: e.target.value }))} /></div>
          <div className="form-group"><label>Category *</label><select value={form.Category} onChange={(e) => setForm((f) => ({ ...f, Category: e.target.value }))}><option value="">Select</option>{INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="form-group"><label>Amount ({CURRENCY_SYMBOL}) *</label><input type="number" step="0.01" value={form.Amount} onChange={(e) => setForm((f) => ({ ...f, Amount: e.target.value }))} /></div>
          <div className="form-group"><label>Received By Partner *</label><select value={form.Partner_Account} onChange={(e) => setForm((f) => ({ ...f, Partner_Account: e.target.value }))}><option value="">Select</option>{partners.map((p) => <option key={p.Partner_ID} value={p.Partner_ID}>{p.Partner_Name}</option>)}</select></div>
          <div className="form-group span-2"><label>Description</label><input type="text" value={form.Description} onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))} /></div>
          <div className="form-group"><label>Payment Method</label><select value={form.Payment_Method} onChange={(e) => setForm((f) => ({ ...f, Payment_Method: e.target.value }))}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
          <div className="form-group"><label>Added By</label><input type="text" value={form.Added_By} onChange={(e) => setForm((f) => ({ ...f, Added_By: e.target.value }))} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => { setShowEdit(false); setEditTxId(null); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEditSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </Modal>
    </div>
  );
}
