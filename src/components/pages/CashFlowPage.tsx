'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import { formatCurrency, getMonthlyData, projectCashFlow } from '@/lib/utils';
import { CHART_COLORS, CURRENCY_SYMBOL } from '@/lib/constants';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function CashFlowPage() {
  const { partners, transactions } = useApp();

  const totalCash = partners.reduce((s, p) => s + p.Current_Balance, 0);
  const monthlyData = useMemo(() => getMonthlyData(transactions, 6), [transactions]);
  const projection = useMemo(() => projectCashFlow(totalCash, transactions, 3), [totalCash, transactions]);

  const avgExpenses = monthlyData.expenses.reduce((s, v) => s + v, 0) / Math.max(monthlyData.expenses.length, 1);
  const avgRevenue = monthlyData.revenue.reduce((s, v) => s + v, 0) / Math.max(monthlyData.revenue.length, 1);
  const runway = avgExpenses > 0 ? totalCash / avgExpenses : 999;
  const bestMonth = monthlyData.labels[monthlyData.profit.indexOf(Math.max(...monthlyData.profit))] || 'N/A';
  const worstMonth = monthlyData.labels[monthlyData.profit.indexOf(Math.min(...monthlyData.profit))] || 'N/A';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { family: "'Inter', sans-serif" } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)', padding: 12, cornerRadius: 8,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: { label: (ctx: any) => `${ctx.dataset.label || ''}: ${CURRENCY_SYMBOL}${ctx.parsed.y?.toLocaleString('en-IN') ?? ''}` },
      },
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
      y: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ticks: { color: 'rgba(255,255,255,0.5)', callback: (v: any) => `${CURRENCY_SYMBOL}${Number(v).toLocaleString('en-IN')}` },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  };

  const inflowOutflowData = {
    labels: monthlyData.labels,
    datasets: [
      { label: 'Inflow', data: monthlyData.revenue, backgroundColor: 'rgba(16,185,129,0.6)', borderRadius: 6 },
      { label: 'Outflow', data: monthlyData.expenses, backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6 },
    ],
  };

  const projectionData = {
    labels: projection.labels,
    datasets: [
      { label: 'Actual Balance', data: projection.actual, borderColor: CHART_COLORS.primary, backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'Projected Balance', data: projection.projected, borderColor: CHART_COLORS.warning, backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4, borderDash: [5, 5], pointRadius: 4 },
    ],
  };

  const netCashFlowData = {
    labels: monthlyData.labels,
    datasets: [
      { label: 'Net Cash Flow', data: monthlyData.profit, backgroundColor: monthlyData.profit.map((v) => v >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'), borderRadius: 6 },
    ],
  };

  return (
    <div className="page-content">
      {/* Summary Cards */}
      <div className="metrics-grid grid-4">
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className="mini-stat-value">{formatCurrency(totalCash, true)}</span>
            <span className="mini-stat-label">Current Cash Balance</span>
          </div>
        </Card>
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className="mini-stat-value">{formatCurrency(avgExpenses, true)}</span>
            <span className="mini-stat-label">Avg Monthly Burn Rate</span>
          </div>
        </Card>
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className={`mini-stat-value ${runway < 6 ? 'amount-negative' : 'amount-positive'}`}>
              {runway >= 999 ? '∞' : `${runway.toFixed(1)} months`}
            </span>
            <span className="mini-stat-label">Runway</span>
          </div>
        </Card>
        <Card className="summary-mini-card">
          <div className="mini-stat">
            <span className="mini-stat-value">{formatCurrency(avgRevenue - avgExpenses, true)}</span>
            <span className="mini-stat-label">Avg Net Flow/Month</span>
          </div>
        </Card>
      </div>

      <div className="charts-grid">
        <Card title="Cash Inflow vs Outflow" className="chart-card span-2">
          <div className="chart-container"><Bar data={inflowOutflowData} options={chartOpts} /></div>
        </Card>
        <Card title="Net Cash Flow" className="chart-card">
          <div className="chart-container"><Bar data={netCashFlowData} options={chartOpts} /></div>
        </Card>
      </div>

      <Card title="Cash Flow Projection (Next 3 Months)" className="chart-card">
        <div className="chart-container-lg"><Line data={projectionData} options={chartOpts} /></div>
      </Card>

      <div className="metrics-grid grid-2">
        <Card className="summary-mini-card">
          <div className="mini-stat"><span className="mini-stat-value amount-positive">{bestMonth}</span><span className="mini-stat-label">Best Cash Flow Month</span></div>
        </Card>
        <Card className="summary-mini-card">
          <div className="mini-stat"><span className="mini-stat-value amount-negative">{worstMonth}</span><span className="mini-stat-label">Worst Cash Flow Month</span></div>
        </Card>
      </div>
    </div>
  );
}
