'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import MetricCard from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/SharedComponents';
import {
  Wallet, TrendingUp, TrendingDown, BarChart3,
  Flame, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  calculateDashboardMetrics,
  formatCurrency,
  getMonthlyData,
  getCategoryBreakdown,
  formatDate,
} from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { CHART_COLORS, CHART_PALETTE, CURRENCY_SYMBOL } from '@/lib/constants';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function DashboardPage() {
  const { partners, transactions } = useApp();

  const metrics = useMemo(
    () => calculateDashboardMetrics(partners, transactions),
    [partners, transactions]
  );

  const monthlyData = useMemo(
    () => getMonthlyData(transactions, 6),
    [transactions]
  );

  const expenseBreakdown = useMemo(
    () => getCategoryBreakdown(transactions, 'Expense'),
    [transactions]
  );

  const revenueBreakdown = useMemo(
    () => getCategoryBreakdown(transactions, 'Income'),
    [transactions]
  );

  const recentTransactions = useMemo(
    () => [...transactions]
      .filter((t) => t.Transaction_ID)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, 10),
    [transactions]
  );

  const partnerMap = useMemo(() => {
    const map = new Map<string, string>();
    partners.forEach((p) => map.set(p.Partner_ID, p.Partner_Name));
    return map;
  }, [partners]);



  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) =>
            `${ctx.dataset.label}: ${CURRENCY_SYMBOL}${ctx.parsed.y?.toLocaleString('en-IN') ?? ''}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.5)' },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (v: any) => `${CURRENCY_SYMBOL}${Number(v).toLocaleString('en-IN')}`,
        },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  };

  const revenueExpenseData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.revenue,
        borderColor: CHART_COLORS.success,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: CHART_COLORS.success,
      },
      {
        label: 'Expenses',
        data: monthlyData.expenses,
        borderColor: CHART_COLORS.danger,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: CHART_COLORS.danger,
      },
    ],
  };

  const profitLossData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Profit/Loss',
        data: monthlyData.profit,
        backgroundColor: monthlyData.profit.map((v) =>
          v >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
        ),
        borderRadius: 6,
      },
    ],
  };

  const expensePieData = {
    labels: expenseBreakdown.labels.slice(0, 8),
    datasets: [
      {
        data: expenseBreakdown.values.slice(0, 8),
        backgroundColor: CHART_PALETTE.slice(0, 8),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const revenuePieData = {
    labels: revenueBreakdown.labels.slice(0, 8),
    datasets: [
      {
        data: revenueBreakdown.values.slice(0, 8),
        backgroundColor: CHART_PALETTE.slice(0, 8),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) =>
            `${ctx.label}: ${CURRENCY_SYMBOL}${ctx.parsed.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  const totalFunds = partners.reduce((s, p) => s + p.Current_Balance, 0);

  return (
    <div className="dashboard-page">
      {/* Metric Cards Row */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Arneor Labs Funds"
          value={formatCurrency(metrics.totalCashAvailable, true)}
          icon={Wallet}
          color="primary"
          subtitle={`Across ${partners.length} partners`}
        />
        <MetricCard
          title="Product Revenue This Month"
          value={formatCurrency(metrics.thisMonthRevenue, true)}
          icon={TrendingUp}
          color="success"
        />
        <MetricCard
          title="R&D and Operating Expenses"
          value={formatCurrency(metrics.thisMonthExpenses, true)}
          icon={TrendingDown}
          color="danger"
        />
        <MetricCard
          title="Net Profit/Loss"
          value={formatCurrency(metrics.thisMonthProfitLoss, true)}
          icon={BarChart3}
          color={metrics.thisMonthProfitLoss >= 0 ? 'success' : 'danger'}
        />
{/* Outstanding Loans Removed */}
        <MetricCard
          title="Monthly Burn Rate (Product Dev)"
          value={formatCurrency(metrics.burnRate, true)}
          icon={Flame}
          color="info"
          subtitle={metrics.burnRate > 0 ? `~${Math.floor(metrics.totalCashAvailable / metrics.burnRate)} months runway` : 'No data'}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <Card title="Arneor Labs: Monthly Revenue vs Operating Costs" className="chart-card span-2">
          <div className="chart-container">
            <Line data={revenueExpenseData} options={chartOptions} />
          </div>
        </Card>
        <Card title="Monthly Profit/Loss" className="chart-card">
          <div className="chart-container">
            <Bar data={profitLossData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="charts-grid">
        <Card title="R&D and Operational Expense Distribution" className="chart-card">
          <div className="chart-container-sm">
            {expenseBreakdown.labels.length > 0 ? (
              <Doughnut data={expensePieData} options={doughnutOptions} />
            ) : (
              <p className="no-data-text">No expense data yet</p>
            )}
          </div>
        </Card>
        <Card title="Product Revenue Streams" className="chart-card">
          <div className="chart-container-sm">
            {revenueBreakdown.labels.length > 0 ? (
              <Doughnut data={revenuePieData} options={doughnutOptions} />
            ) : (
              <p className="no-data-text">No revenue data yet</p>
            )}
          </div>
        </Card>
        <Card title="Partner Fund Holdings - Arneor Labs" className="chart-card">
          <div className="partner-distribution">
            {partners.map((p) => (
              <div key={p.Partner_ID} className="partner-bar-item">
                <div className="partner-bar-header">
                  <span className="partner-bar-name">{p.Partner_Name}</span>
                  <span className="partner-bar-value">{formatCurrency(p.Current_Balance)}</span>
                </div>
                <div className="partner-bar-track">
                  <div
                    className="partner-bar-fill"
                    style={{
                      width: totalFunds > 0
                        ? `${(p.Current_Balance / totalFunds) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="partner-bar-pct">
                  {totalFunds > 0 ? `${((p.Current_Balance / totalFunds) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity Row */}
      <div className="activity-grid">
        <Card title="Recent Transactions" className="span-2">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Partner</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data-cell">No transactions yet</td>
                  </tr>
                ) : (
                  recentTransactions.map((t) => (
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
                      <td>{partnerMap.get(t.Partner_Account) || t.Partner_Account}</td>
                      <td className="desc-cell">{t.Description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

{/* Upcoming Loans Removed */}
      </div>
    </div>
  );
}
