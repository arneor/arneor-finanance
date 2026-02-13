'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import { formatCurrency, formatPercentage, getCategoryBreakdown, parseDate } from '@/lib/utils';
import { MONTHS, CURRENCY_SYMBOL } from '@/lib/constants';

export default function PnLPage() {
  const { transactions } = useApp();
  const now = new Date();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const filtered = useMemo(() => {
    let from: Date, to: Date;
    switch (period) {
      case 'month':
        from = new Date(selectedYear, selectedMonth, 1);
        to = new Date(selectedYear, selectedMonth + 1, 0);
        break;
      case 'quarter': {
        const q = Math.floor(selectedMonth / 3);
        from = new Date(selectedYear, q * 3, 1);
        to = new Date(selectedYear, (q + 1) * 3, 0);
        break;
      }
      case 'year':
        from = new Date(selectedYear, 0, 1);
        to = new Date(selectedYear, 11, 31);
        break;
      case 'custom':
        from = customFrom ? new Date(customFrom) : new Date(selectedYear, 0, 1);
        to = customTo ? new Date(customTo) : new Date();
        break;
    }
    return transactions.filter((t) => {
      const d = parseDate(t.Date);
      return d >= from && d <= to && t.Transaction_ID;
    });
  }, [transactions, period, selectedMonth, selectedYear, customFrom, customTo]);

  const totalRevenue = filtered.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
  const totalExpenses = filtered.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const revenueBreakdown = getCategoryBreakdown(filtered, 'Income');
  const expenseBreakdown = getCategoryBreakdown(filtered, 'Expense');

  // Compare with previous period
  const prevFiltered = useMemo(() => {
    let from: Date, to: Date;
    switch (period) {
      case 'month':
        from = new Date(selectedYear, selectedMonth - 1, 1);
        to = new Date(selectedYear, selectedMonth, 0);
        break;
      case 'quarter': {
        const q = Math.floor(selectedMonth / 3);
        from = new Date(selectedYear, (q - 1) * 3, 1);
        to = new Date(selectedYear, q * 3, 0);
        break;
      }
      case 'year':
        from = new Date(selectedYear - 1, 0, 1);
        to = new Date(selectedYear - 1, 11, 31);
        break;
      default:
        return [];
    }
    return transactions.filter((t) => {
      const d = parseDate(t.Date);
      return d >= from && d <= to && t.Transaction_ID;
    });
  }, [transactions, period, selectedMonth, selectedYear]);

  const prevRevenue = prevFiltered.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
  const prevExpenses = prevFiltered.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

  return (
    <div className="page-content">
      {/* Period Selector */}
      <Card className="period-selector">
        <div className="period-tabs">
          {(['month', 'quarter', 'year', 'custom'] as const).map((p) => (
            <button key={p} className={`period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div className="period-controls">
          {period !== 'custom' && (
            <>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <span>to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          )}
        </div>
      </Card>

      {/* P&L Summary */}
      <div className="pnl-summary">
        <Card className="pnl-card pnl-revenue">
          <div className="pnl-main">
            <h3>Total Revenue</h3>
            <p className="pnl-amount amount-positive">{formatCurrency(totalRevenue)}</p>
            {period !== 'custom' && (
              <span className={`pnl-change ${revenueChange >= 0 ? 'up' : 'down'}`}>
                {revenueChange >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(revenueChange))} vs prev period
              </span>
            )}
          </div>
        </Card>
        <Card className="pnl-card pnl-minus">
          <div className="pnl-main">
            <h3 style={{ fontSize: '2rem' }}>−</h3>
          </div>
        </Card>
        <Card className="pnl-card pnl-expense">
          <div className="pnl-main">
            <h3>Total Expenses</h3>
            <p className="pnl-amount amount-negative">{formatCurrency(totalExpenses)}</p>
            {period !== 'custom' && (
              <span className={`pnl-change ${expenseChange <= 0 ? 'up' : 'down'}`}>
                {expenseChange >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(expenseChange))} vs prev period
              </span>
            )}
          </div>
        </Card>
        <Card className="pnl-card pnl-equals">
          <div className="pnl-main">
            <h3 style={{ fontSize: '2rem' }}>=</h3>
          </div>
        </Card>
        <Card className={`pnl-card ${grossProfit >= 0 ? 'pnl-profit' : 'pnl-loss'}`}>
          <div className="pnl-main">
            <h3>{grossProfit >= 0 ? 'Net Profit' : 'Net Loss'}</h3>
            <p className={`pnl-amount ${grossProfit >= 0 ? 'amount-positive' : 'amount-negative'}`}>{formatCurrency(Math.abs(grossProfit))}</p>
            <span className="pnl-margin">Margin: {formatPercentage(profitMargin)}</span>
          </div>
        </Card>
      </div>

      {/* Breakdown Tables */}
      <div className="charts-grid grid-2">
        <Card title="Revenue Breakdown">
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Category</th><th>Amount</th><th>% of Total</th></tr></thead>
              <tbody>
                {revenueBreakdown.labels.length === 0 ? (
                  <tr><td colSpan={3} className="no-data-cell">No revenue in this period</td></tr>
                ) : (
                  revenueBreakdown.labels.map((label, i) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td className="amount-positive">{formatCurrency(revenueBreakdown.values[i])}</td>
                      <td>{totalRevenue > 0 ? formatPercentage((revenueBreakdown.values[i] / totalRevenue) * 100) : '0%'}</td>
                    </tr>
                  ))
                )}
                <tr className="total-row">
                  <td><strong>Total Revenue</strong></td>
                  <td className="amount-positive"><strong>{formatCurrency(totalRevenue)}</strong></td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Expense Breakdown">
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Category</th><th>Amount ({CURRENCY_SYMBOL})</th><th>% of Total</th></tr></thead>
              <tbody>
                {expenseBreakdown.labels.length === 0 ? (
                  <tr><td colSpan={3} className="no-data-cell">No expenses in this period</td></tr>
                ) : (
                  expenseBreakdown.labels.map((label, i) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td className="amount-negative">{formatCurrency(expenseBreakdown.values[i])}</td>
                      <td>{totalExpenses > 0 ? formatPercentage((expenseBreakdown.values[i] / totalExpenses) * 100) : '0%'}</td>
                    </tr>
                  ))
                )}
                <tr className="total-row">
                  <td><strong>Total Expenses</strong></td>
                  <td className="amount-negative"><strong>{formatCurrency(totalExpenses)}</strong></td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
