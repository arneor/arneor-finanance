'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import { downloadCSV } from '@/lib/utils';
import { Download, FileText, BarChart3, PieChart, Users, CalendarDays, Calculator } from 'lucide-react';

export default function ReportsPage() {
  const { transactions, partners, budgets, transfers } = useApp();

  const reports = [
    {
      title: 'Full Transaction Ledger',
      description: 'Complete history of all financial transactions',
      icon: <FileText size={24} />,
      color: 'primary',
      onExport: () => downloadCSV(transactions.filter((t) => t.Transaction_ID), 'arneor_transaction_ledger'),
      count: transactions.filter((t) => t.Transaction_ID).length,
    },
    {
      title: 'Product Revenue Report',
      description: 'Detailed breakdown of all revenue sources',
      icon: <BarChart3 size={24} />,
      color: 'success',
      onExport: () => downloadCSV(transactions.filter((t) => t.Type === 'Income' && t.Transaction_ID), 'arneor_revenue_report'),
      count: transactions.filter((t) => t.Type === 'Income').length,
    },
    {
      title: 'R&D & Operating Expense Report',
      description: 'Detailed breakdown of all company expenses',
      icon: <PieChart size={24} />,
      color: 'danger',
      onExport: () => downloadCSV(transactions.filter((t) => t.Type === 'Expense' && t.Transaction_ID), 'arneor_expense_report'),
      count: transactions.filter((t) => t.Type === 'Expense').length,
    },
    {
      title: 'Partner Holdings Summary',
      description: 'Current funds held by each partner',
      icon: <Users size={24} />,
      color: 'info',
      onExport: () => downloadCSV(partners, 'arneor_partner_holdings'),
      count: partners.length,
    },

    {
      title: 'Budget Utilization Report',
      description: 'Budget allocation vs actual spending',
      icon: <CalendarDays size={24} />,
      color: 'purple',
      onExport: () => downloadCSV(budgets.filter((b) => b.Category), 'arneor_budget_report'),
      count: budgets.filter((b) => b.Category).length,
    },
    {
      title: 'Inter-Partner Transfer Log',
      description: 'History of funds transferred between partners',
      icon: <Calculator size={24} />,
      color: 'teal',
      onExport: () => downloadCSV(transfers.filter((t) => t.Transfer_ID), 'arneor_transfer_log'),
      count: transfers.filter((t) => t.Transfer_ID).length,
    },
    {
      title: 'Expense Distribution by Category',
      description: 'Grouped expenses for analysis',
      icon: <PieChart size={24} />,
      color: 'orange',
      onExport: () => {
        const categoryMap = new Map<string, number>();
        transactions.filter((t) => t.Type === 'Expense')
          .forEach((t) => categoryMap.set(t.Category, (categoryMap.get(t.Category) || 0) + t.Amount));
        const data = Array.from(categoryMap.entries()).map(([cat, amount]) => ({
          Category: cat, Total_Amount: amount, Percentage: `${((amount / (Array.from(categoryMap.values()).reduce((s, v) => s + v, 0))) * 100).toFixed(1)}%`
        }));
        downloadCSV(data, 'arneor_category_spending');
      },
      count: new Set(transactions.filter((t) => t.Type === 'Expense').map((t) => t.Category)).size,
    },
  ];

  return (
    <div className="page-content">
      <div className="reports-header">
        <h2 className="section-title">Arneor Labs Financial Reports</h2>
        <p className="section-subtitle">Export financial data for internal audits, R&D expense tracking, and revenue analysis</p>
      </div>

      <div className="report-cards-grid">
        {reports.map((report) => (
          <Card key={report.title} className={`report-card report-${report.color}`}>
            <div className="report-card-icon">{report.icon}</div>
            <h3 className="report-card-title">{report.title}</h3>
            <p className="report-card-desc">{report.description}</p>
            <span className="report-card-count">{report.count} records</span>
            <button className="btn btn-outline btn-sm report-export-btn" onClick={report.onExport}>
              <Download size={14} /> Export CSV
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
