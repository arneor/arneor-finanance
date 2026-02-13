'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, Badge } from '@/components/ui/SharedComponents';
import Modal from '@/components/ui/Modal';
import { updatePartner, addTransfer } from '@/lib/google-sheets';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, Edit2, ArrowRightLeft, Mail, Phone, Wallet } from 'lucide-react';

export default function PartnersPage() {
  const { partners, transactions, transfers, refreshData, addAlert } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [editForm, setEditForm] = useState({ Partner_Name: '', Phone: '', Email: '' });
  const [transferForm, setTransferForm] = useState({ From_Partner: '', To_Partner: '', Amount: '', Purpose: '' });
  const [submitting, setSubmitting] = useState(false);

  const totalFunds = partners.reduce((s, p) => s + p.Current_Balance, 0);

  const partnerStats = useMemo(() => {
    return partners.map((p) => {
      const pTxns = transactions.filter((t) => t.Partner_Account === p.Partner_ID);
      const capitalAdded = pTxns
        .filter((t) => t.Type === 'Income' && t.Category === 'Partner Capital Injection')
        .reduce((s, t) => s + t.Amount, 0);
      const txCount = pTxns.length;
      return { ...p, capitalAdded, txCount };
    });
  }, [partners, transactions]);



  const handleEdit = (idx: number) => {
    const p = partners[idx];
    setEditIdx(idx);
    setEditForm({ Partner_Name: p.Partner_Name, Phone: p.Phone, Email: p.Email });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      await updatePartner(editIdx, editForm);
      addAlert({ type: 'success', title: 'Updated', message: 'Partner updated successfully' });
      setShowEdit(false);
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to update partner' });
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleTransfer = async () => {
    if (!transferForm.From_Partner || !transferForm.To_Partner || !transferForm.Amount) return;
    if (transferForm.From_Partner === transferForm.To_Partner) {
      addAlert({ type: 'warning', title: 'Invalid', message: 'Cannot transfer to the same partner' });
      return;
    }
    setSubmitting(true);
    try {
      await addTransfer({
        Date: new Date().toISOString().split('T')[0],
        From_Partner: transferForm.From_Partner,
        To_Partner: transferForm.To_Partner,
        Amount: parseFloat(transferForm.Amount),
        Purpose: transferForm.Purpose,
      });
      addAlert({ type: 'success', title: 'Transferred', message: 'Fund transfer completed' });
      setShowTransfer(false);
      setTransferForm({ From_Partner: '', To_Partner: '', Amount: '', Purpose: '' });
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Transfer failed' });
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Arneor Labs Partners</h1>

      </div>

      <div className="page-header-bar">
        <div>
          <h2 className="page-subtitle">Total Company Capital</h2>
          <p className="page-big-value">{formatCurrency(totalFunds)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTransfer(true)}>
          <ArrowRightLeft size={16} /> Inter-Partner Transfer
        </button>
      </div>

      {/* Partner Cards */}
      <div className="partner-cards-grid">
        {partnerStats.map((p, idx) => (
          <Card key={p.Partner_ID} className="partner-card">
            <div className="partner-card-top">
              <div className="partner-avatar">
                <Users size={20} />
              </div>
              <div className="partner-name-wrap">
                <h3 className="partner-name">{p.Partner_Name}</h3>
                <span className="partner-id">{p.Partner_ID}</span>
              </div>
              <button className="icon-btn" onClick={() => handleEdit(idx)}>
                <Edit2 size={16} />
              </button>
            </div>

            <div className="partner-balance">
              <Wallet size={16} />
              <span className="partner-balance-value">{formatCurrency(p.Current_Balance)}</span>
              <Badge variant={p.Current_Balance > 0 ? 'success' : p.Current_Balance < 0 ? 'danger' : 'default'}>
                Funds Held: {totalFunds > 0 ? `${((p.Current_Balance / totalFunds) * 100).toFixed(1)}%` : '0%'}
              </Badge>
            </div>

            <div className="partner-stats">
              <div className="partner-stat">
                <span className="stat-label">Capital Added</span>
                <span className="stat-value amount-positive">{formatCurrency(p.capitalAdded)}</span>
              </div>
              <div className="partner-stat">
                <span className="stat-label">Txn History</span>
                <span className="stat-value">{p.txCount} entries</span>
              </div>
            </div>

            <div className="partner-contact">
              {p.Phone && <span><Phone size={14} /> {p.Phone}</span>}
              {p.Email && <span><Mail size={14} /> {p.Email}</span>}
            </div>

            <div className="partner-updated">
              Last updated: {formatDate(p.Last_Updated)}
            </div>
          </Card>
        ))}
      </div>



      {/* Recent Transfers */}
      {transfers.length > 0 && (
        <Card title="Transfer History">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>From</th><th>To</th><th>Amount</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                {transfers.slice(-10).reverse().map((t) => (
                  <tr key={t.Transfer_ID}>
                    <td>{formatDate(t.Date)}</td>
                    <td>{partners.find((p) => p.Partner_ID === t.From_Partner)?.Partner_Name || t.From_Partner}</td>
                    <td>{partners.find((p) => p.Partner_ID === t.To_Partner)?.Partner_Name || t.To_Partner}</td>
                    <td>{formatCurrency(t.Amount)}</td>
                    <td>{t.Purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Partner">
        <div className="form-grid">
          <div className="form-group span-2">
            <label>Partner Name</label>
            <input type="text" value={editForm.Partner_Name} onChange={(e) => setEditForm((f) => ({ ...f, Partner_Name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={editForm.Phone} onChange={(e) => setEditForm((f) => ({ ...f, Phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={editForm.Email} onChange={(e) => setEditForm((f) => ({ ...f, Email: e.target.value }))} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveEdit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Inter-Partner Transfer">
        <div className="form-grid">
          <div className="form-group">
            <label>From Partner *</label>
            <select value={transferForm.From_Partner} onChange={(e) => setTransferForm((f) => ({ ...f, From_Partner: e.target.value }))}>
              <option value="">Select</option>
              {partners.map((p) => <option key={p.Partner_ID} value={p.Partner_ID}>{p.Partner_Name} ({formatCurrency(p.Current_Balance)})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>To Partner *</label>
            <select value={transferForm.To_Partner} onChange={(e) => setTransferForm((f) => ({ ...f, To_Partner: e.target.value }))}>
              <option value="">Select</option>
              {partners.map((p) => <option key={p.Partner_ID} value={p.Partner_ID}>{p.Partner_Name} ({formatCurrency(p.Current_Balance)})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Amount *</label>
            <input type="number" step="0.01" value={transferForm.Amount} onChange={(e) => setTransferForm((f) => ({ ...f, Amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Purpose</label>
            <input type="text" value={transferForm.Purpose} onChange={(e) => setTransferForm((f) => ({ ...f, Purpose: e.target.value }))} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => setShowTransfer(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleTransfer} disabled={submitting}>
            {submitting ? 'Processing...' : 'Transfer Funds'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
