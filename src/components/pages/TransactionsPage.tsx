'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import Modal from '@/components/ui/Modal';
import { TransactionFilters, TransactionFormData } from '@/lib/types';
import { addTransaction, deleteTransaction } from '@/lib/google-sheets';
import {
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, CURRENCY_SYMBOL,
} from '@/lib/constants';
import {
  formatDate, formatCurrency, today, downloadCSV, validateAmount, validateRequired,
} from '@/lib/utils';
import {
  Plus, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Trash2, Edit2, X,
} from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, partners, refreshData, addAlert } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortField, setSortField] = useState<string>('Date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [filters, setFilters] = useState<TransactionFilters>({
    dateFrom: '', dateTo: '', type: '', category: '',
    partner: '', amountMin: '', amountMax: '', search: '',
  });

  const [form, setForm] = useState<TransactionFormData>({
    Date: today(), Type: 'Expense', Category: '',
    Amount: '', Partner_Account: '', Description: '',
    Payment_Method: 'Bank Transfer', Tags: '', Added_By: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let result = transactions.filter((t) => t.Transaction_ID);

    if (filters.dateFrom) result = result.filter((t) => t.Date >= filters.dateFrom);
    if (filters.dateTo) result = result.filter((t) => t.Date <= filters.dateTo);
    if (filters.type) result = result.filter((t) => t.Type === filters.type);
    if (filters.category) result = result.filter((t) => t.Category === filters.category);
    if (filters.partner) result = result.filter((t) => t.Partner_Account === filters.partner);
    if (filters.amountMin) result = result.filter((t) => t.Amount >= parseFloat(filters.amountMin));
    if (filters.amountMax) result = result.filter((t) => t.Amount <= parseFloat(filters.amountMax));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((t) =>
        t.Description.toLowerCase().includes(q) ||
        t.Category.toLowerCase().includes(q) ||
        t.Tags.toLowerCase().includes(q) ||
        t.Transaction_ID.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aVal = (a as any)[sortField];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bVal = (b as any)[sortField];
      if (sortField === 'Amount') {
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [transactions, filters, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    const amtErr = validateAmount(form.Amount);
    if (amtErr) errs.Amount = amtErr;
    const catErr = validateRequired(form.Category, 'Category');
    if (catErr) errs.Category = catErr;
    const partErr = validateRequired(form.Partner_Account, 'Partner');
    if (partErr) errs.Partner_Account = partErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await addTransaction({
        Date: form.Date,
        Type: form.Type,
        Category: form.Category,
        Amount: parseFloat(form.Amount),
        Partner_Account: form.Partner_Account,
        Description: form.Description,
        Payment_Method: form.Payment_Method,
        Tags: form.Tags,
        Added_By: form.Added_By,
      });
      addAlert({ type: 'success', title: 'Success', message: 'Transaction added successfully to Arneor Labs records' });
      setShowAddModal(false);
      setForm({
        Date: today(), Type: 'Expense', Category: '',
        Amount: '', Partner_Account: '', Description: '',
        Payment_Method: 'Bank Transfer', Tags: '', Added_By: '',
      });
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to add transaction to Arneor database' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this transaction from Arneor records?')) return;
    try {
      // Find real row index in the sheet (account for filtering/sorting)
      const txId = paginated[index].Transaction_ID;
      const realIndex = transactions.findIndex((t) => t.Transaction_ID === txId);
      if (realIndex === -1) return;
      await deleteTransaction(realIndex);
      addAlert({ type: 'success', title: 'Deleted', message: 'Transaction removed from Arneor records' });
      await refreshData();
    } catch (err) {
      addAlert({ type: 'danger', title: 'Error', message: 'Failed to delete' });
      console.error(err);
    }
  };

  const categories = form.Type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const totalIncome = filtered.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
  const totalExpense = filtered.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);

  return (
    <div className="page-content">
      {/* Summary Bar */}
      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-label">Total Transactions</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Income</span>
          <span className="summary-value amount-positive">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Expenses</span>
          <span className="summary-value amount-negative">{formatCurrency(totalExpense)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Net</span>
          <span className={`summary-value ${totalIncome - totalExpense >= 0 ? 'amount-positive' : 'amount-negative'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          {filters.search && (
            <button className="search-clear" onClick={() => setFilters((f) => ({ ...f, search: '' }))}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`btn btn-outline ${showFilterPanel ? 'btn-active' : ''}`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter size={16} /> Filters
          </button>
          <button
            className="btn btn-outline"
            onClick={() => downloadCSV(filtered, 'transactions')}
          >
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilterPanel && (
        <Card className="filter-panel">
          <div className="filter-grid">
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                <option value="">All</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
                <option value="">All</option>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Partner</label>
              <select value={filters.partner}
                onChange={(e) => setFilters((f) => ({ ...f, partner: e.target.value }))}>
                <option value="">All</option>
                {partners.map((p) => (
                  <option key={p.Partner_ID} value={p.Partner_ID}>{p.Partner_Name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Min Amount</label>
              <input type="number" placeholder={`${CURRENCY_SYMBOL}0`} value={filters.amountMin}
                onChange={(e) => setFilters((f) => ({ ...f, amountMin: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Max Amount</label>
              <input type="number" placeholder="No limit" value={filters.amountMax}
                onChange={(e) => setFilters((f) => ({ ...f, amountMax: e.target.value }))} />
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <button className="btn btn-outline btn-sm"
                onClick={() => setFilters({
                  dateFrom: '', dateTo: '', type: '', category: '',
                  partner: '', amountMin: '', amountMax: '', search: '',
                })}>
                Clear All
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('Date')} className="sortable">
                  Date {sortField === 'Date' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('Type')} className="sortable">
                  Type {sortField === 'Type' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('Category')} className="sortable">
                  Category {sortField === 'Category' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('Amount')} className="sortable">
                  Amount {sortField === 'Amount' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Partner</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="no-data-cell">No transactions found</td></tr>
              ) : (
                paginated.map((t, i) => (
                  <tr key={t.Transaction_ID}>
                    <td>{formatDate(t.Date)}</td>
                    <td>
                      <span className={`type-badge ${t.Type === 'Income' ? 'type-income' : 'type-expense'}`}>
                        {t.Type === 'Income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {t.Type}
                      </span>
                    </td>
                    <td>{t.Category}</td>
                    <td className={t.Type === 'Income' ? 'amount-positive' : 'amount-negative'}>
                      {t.Type === 'Income' ? '+' : '-'}{formatCurrency(t.Amount)}
                    </td>
                    <td>{partners.find((p) => p.Partner_ID === t.Partner_Account)?.Partner_Name || t.Partner_Account}</td>
                    <td className="desc-cell">{t.Description}</td>
                    <td>{t.Payment_Method}</td>
                    <td>{t.Tags && <span className="tag">{t.Tags}</span>}</td>
                    <td>
                      <div className="action-cell">
                        <button className="icon-btn" title="Edit"><Edit2 size={14} /></button>
                        <button className="icon-btn danger" onClick={() => handleDelete(i)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-sm btn-outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button
              className="btn btn-sm btn-outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Transaction" size="lg">
        <div className="form-grid">
          <div className="form-group">
            <label>Date *</label>
            <input type="date" value={form.Date}
              onChange={(e) => setForm((f) => ({ ...f, Date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Type *</label>
            <div className="type-toggle">
              <button
                className={`toggle-btn ${form.Type === 'Income' ? 'active income' : ''}`}
                onClick={() => setForm((f) => ({ ...f, Type: 'Income', Category: '' }))}
              >
                <ArrowUpRight size={16} /> Income
              </button>
              <button
                className={`toggle-btn ${form.Type === 'Expense' ? 'active expense' : ''}`}
                onClick={() => setForm((f) => ({ ...f, Type: 'Expense', Category: '' }))}
              >
                <ArrowDownRight size={16} /> Expense
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select value={form.Category}
              onChange={(e) => setForm((f) => ({ ...f, Category: e.target.value }))}>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.Category && <span className="form-error">{errors.Category}</span>}
          </div>
          <div className="form-group">
            <label>Amount ({CURRENCY_SYMBOL}) *</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.Amount}
              onChange={(e) => setForm((f) => ({ ...f, Amount: e.target.value }))} />
            {errors.Amount && <span className="form-error">{errors.Amount}</span>}
          </div>
          <div className="form-group">
            <label>Partner Account *</label>
            <select value={form.Partner_Account}
              onChange={(e) => setForm((f) => ({ ...f, Partner_Account: e.target.value }))}>
              <option value="">Select Partner</option>
              {partners.map((p) => (
                <option key={p.Partner_ID} value={p.Partner_ID}>{p.Partner_Name}</option>
              ))}
            </select>
            {errors.Partner_Account && <span className="form-error">{errors.Partner_Account}</span>}
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select value={form.Payment_Method}
              onChange={(e) => setForm((f) => ({ ...f, Payment_Method: e.target.value }))}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group span-2">
            <label>Description</label>
            <input type="text" placeholder="Enter description" value={form.Description}
              onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Tags</label>
            <input type="text" placeholder="comma-separated tags" value={form.Tags}
              onChange={(e) => setForm((f) => ({ ...f, Tags: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Added By</label>
            <input type="text" placeholder="Your name" value={form.Added_By}
              onChange={(e) => setForm((f) => ({ ...f, Added_By: e.target.value }))} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
