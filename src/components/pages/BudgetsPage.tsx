'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, ProgressBar } from '@/components/ui/SharedComponents';
import Modal from '@/components/ui/Modal';
import { addBudget, updateBudget, deleteBudget } from '@/lib/google-sheets';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/constants';
import { formatCurrency, isCurrentMonth } from '@/lib/utils';
import { Plus, Edit2, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

export default function BudgetsPage() {
  const { budgets, transactions, refreshData, addAlert } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ Category: '', Monthly_Budget: '', Quarterly_Budget: '', Yearly_Budget: '' });

  // Calculate current spending per category
  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.Type === 'Expense' && isCurrentMonth(t.Date))
      .forEach((t) => map.set(t.Category, (map.get(t.Category) || 0) + t.Amount));
    return map;
  }, [transactions]);

  const budgetData = useMemo(() => {
    return budgets.filter((b) => b.Category).map((b) => {
      const spent = spendingByCategory.get(b.Category) || 0;
      const remaining = b.Monthly_Budget - spent;
      const pct = b.Monthly_Budget > 0 ? (spent / b.Monthly_Budget) * 100 : 0;
      return { ...b, Current_Spent: spent, Remaining: remaining, percentage: pct };
    });
  }, [budgets, spendingByCategory]);

  const totalBudget = budgetData.reduce((s, b) => s + b.Monthly_Budget, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.Current_Spent, 0);
  const overBudget = budgetData.filter((b) => b.percentage > 100);

  const usedCategories = budgets.map((b) => b.Category);
  const availableCategories = EXPENSE_CATEGORIES.filter((c) => !usedCategories.includes(c));

  const handleAdd = async () => {
    if (!form.Category || !form.Monthly_Budget) return;
    setSubmitting(true);
    try {
      const monthly = parseFloat(form.Monthly_Budget);
      await addBudget({
        Category: form.Category,
        Monthly_Budget: monthly,
        Quarterly_Budget: parseFloat(form.Quarterly_Budget) || monthly * 3,
        Yearly_Budget: parseFloat(form.Yearly_Budget) || monthly * 12,
        Current_Spent: 0,
        Remaining: monthly,
      });
      addAlert({ type: 'success', title: 'Added', message: 'Budget category added' });
      setShowAdd(false);
      setForm({ Category: '', Monthly_Budget: '', Quarterly_Budget: '', Yearly_Budget: '' });
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to add budget' });
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleEdit = (idx: number) => {
    const b = budgetData[idx];
    setEditIdx(idx);
    setForm({
      Category: b.Category,
      Monthly_Budget: b.Monthly_Budget.toString(),
      Quarterly_Budget: b.Quarterly_Budget.toString(),
      Yearly_Budget: b.Yearly_Budget.toString(),
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      await updateBudget(editIdx, {
        Category: form.Category,
        Monthly_Budget: parseFloat(form.Monthly_Budget),
        Quarterly_Budget: parseFloat(form.Quarterly_Budget),
        Yearly_Budget: parseFloat(form.Yearly_Budget),
        Current_Spent: budgetData[editIdx].Current_Spent,
        Remaining: parseFloat(form.Monthly_Budget) - budgetData[editIdx].Current_Spent,
      });
      addAlert({ type: 'success', title: 'Updated', message: 'Budget updated' });
      setShowEdit(false);
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to update' });
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleDelete = async (idx: number) => {
    if (!window.confirm('Are you sure you want to delete this budget category?')) return;
    setSubmitting(true);
    try {
      await deleteBudget(idx);
      addAlert({ type: 'success', title: 'Deleted', message: 'Budget category removed' });
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to delete budget' });
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content">
      {/* Budget Overview */}
      <div className="metrics-grid grid-3">
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className="mini-stat-value">{formatCurrency(totalBudget, true)}</span>
            <span className="mini-stat-label">Total Monthly Budget</span>
          </div>
        </Card>
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className="mini-stat-value">{formatCurrency(totalSpent, true)}</span>
            <span className="mini-stat-label">Spent This Month</span>
          </div>
        </Card>
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className={`mini-stat-value ${overBudget.length > 0 ? 'amount-negative' : 'amount-positive'}`}>
              {overBudget.length} categories
            </span>
            <span className="mini-stat-label">Over Budget</span>
          </div>
        </Card>
      </div>

      <div className="action-bar">
        <h2 className="section-title">Budget Allocation</h2>
        <button className="btn btn-primary" onClick={() => { setForm({ Category: '', Monthly_Budget: '', Quarterly_Budget: '', Yearly_Budget: '' }); setShowAdd(true); }}>
          <Plus size={16} /> Add Budget Category
        </button>
      </div>

      {/* Budget Cards */}
      <div className="budget-grid">
        {budgetData.length === 0 ? (
          <Card>
            <p className="no-data-text">No budgets set. Add a category to get started.</p>
          </Card>
        ) : (
          budgetData.map((b, idx) => (
            <Card key={b.Category} className={`budget-card ${b.percentage > 100 ? 'budget-over' : b.percentage > 80 ? 'budget-warning' : 'budget-ok'}`}>
              <div className="budget-card-header">
                <h3 className="budget-category">{b.Category}</h3>
                <div className="budget-card-actions">
                  {b.percentage > 100 ? <AlertTriangle size={16} className="text-danger" /> : <CheckCircle size={16} className="text-success" />}
                  <button className="icon-btn" onClick={() => handleEdit(idx)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="icon-btn text-danger" onClick={() => handleDelete(idx)} disabled={submitting}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="budget-amounts">
                <div>
                  <span className="budget-label">Budget</span>
                  <span className="budget-value">{formatCurrency(b.Monthly_Budget)}</span>
                </div>
                <div>
                  <span className="budget-label">Spent</span>
                  <span className={`budget-value ${b.percentage > 100 ? 'amount-negative' : ''}`}>{formatCurrency(b.Current_Spent)}</span>
                </div>
                <div>
                  <span className="budget-label">Remaining</span>
                  <span className={`budget-value ${b.Remaining < 0 ? 'amount-negative' : 'amount-positive'}`}>{formatCurrency(b.Remaining)}</span>
                </div>
              </div>
              <ProgressBar
                value={b.Current_Spent}
                max={b.Monthly_Budget}
                color={b.percentage > 100 ? 'danger' : b.percentage > 80 ? 'warning' : 'success'}
              />
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAdd || showEdit} onClose={() => { setShowAdd(false); setShowEdit(false); }} title={showAdd ? 'Add Budget Category' : 'Edit Budget'}>
        <div className="form-grid">
          <div className="form-group span-2">
            <label>Category</label>
            {showAdd ? (
              <select value={form.Category} onChange={(e) => setForm((f) => ({ ...f, Category: e.target.value }))}>
                <option value="">Select Category</option>
                {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" value={form.Category} disabled />
            )}
          </div>
          <div className="form-group">
            <label>Monthly Budget ({CURRENCY_SYMBOL})</label>
            <input type="number" step="0.01" value={form.Monthly_Budget} onChange={(e) => setForm((f) => ({ ...f, Monthly_Budget: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Quarterly Budget ({CURRENCY_SYMBOL})</label>
            <input type="number" step="0.01" value={form.Quarterly_Budget} placeholder="Auto: 3x monthly" onChange={(e) => setForm((f) => ({ ...f, Quarterly_Budget: e.target.value }))} />
          </div>
          <div className="form-group span-2">
            <label>Yearly Budget ({CURRENCY_SYMBOL})</label>
            <input type="number" step="0.01" value={form.Yearly_Budget} placeholder="Auto: 12x monthly" onChange={(e) => setForm((f) => ({ ...f, Yearly_Budget: e.target.value }))} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setShowEdit(false); }}>Cancel</button>
          <button className="btn btn-primary" onClick={showAdd ? handleAdd : handleSaveEdit} disabled={submitting}>
            {submitting ? 'Saving...' : showAdd ? 'Add Budget' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
