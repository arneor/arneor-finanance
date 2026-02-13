'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/SharedComponents';
import { calculateFinancialHealth, formatCurrency, formatPercentage, getMonthlyData, getCategoryBreakdown } from '@/lib/utils';
import { CHART_COLORS, CHART_PALETTE, CURRENCY_SYMBOL } from '@/lib/constants';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AnalyticsPage() {
  const { partners, transactions } = useApp();

  const health = useMemo(() => calculateFinancialHealth(partners, transactions), [partners, transactions]);
  const monthlyData = useMemo(() => getMonthlyData(transactions, 6), [transactions]);
  const expenseBreakdown = useMemo(() => getCategoryBreakdown(transactions, 'Expense'), [transactions]);
  const revenueBreakdown = useMemo(() => getCategoryBreakdown(transactions, 'Income'), [transactions]);

  const avgRevenue = monthlyData.revenue.reduce((s, v) => s + v, 0) / Math.max(monthlyData.revenue.filter(v => v > 0).length, 1);
  const avgExpenses = monthlyData.expenses.reduce((s, v) => s + v, 0) / Math.max(monthlyData.expenses.filter(v => v > 0).length, 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.7)' } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 12, cornerRadius: 8,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: { label: (ctx: any) => `${ctx.dataset.label || ''}: ${CURRENCY_SYMBOL}${ctx.parsed.y?.toLocaleString('en-IN') ?? ''}` },
      },
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(health.score);

  return (
    <div className="page-content">
      {/* Financial Health Score */}
      <Card title="Financial Health Score" className="health-card">
        <div className="health-score-grid">
          <div className="health-score-circle">
            <svg viewBox="0 0 120 120" className="score-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="10"
                strokeDasharray={`${(health.score / 100) * 314} 314`} strokeLinecap="round"
                transform="rotate(-90 60 60)" />
              <text x="60" y="55" textAnchor="middle" fill={scoreColor} fontSize="28" fontWeight="bold">{health.score}</text>
              <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">out of 100</text>
            </svg>
          </div>
          <div className="health-metrics">

            <div className="health-metric">
              <span className="health-metric-label">Operating Margin</span>
              <span className={`health-metric-value ${health.operatingMargin >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                {formatPercentage(health.operatingMargin)}
              </span>
            </div>
            <div className="health-metric">
              <span className="health-metric-label">Burn Rate</span>
              <span className="health-metric-value">{formatCurrency(health.burnRate, true)}/mo</span>
            </div>
            <div className="health-metric">
              <span className="health-metric-label">Runway</span>
              <span className={`health-metric-value ${health.runway < 6 ? 'amount-negative' : 'amount-positive'}`}>
                {health.runway >= 999 ? '∞' : `${health.runway.toFixed(1)} months`}
              </span>
            </div>
            <div className="health-metric">
              <span className="health-metric-label">Revenue Growth</span>
              <span className={`health-metric-value ${health.revenueGrowth >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                {health.revenueGrowth >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(health.revenueGrowth))}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue & Expense Analytics */}
      <div className="metrics-grid grid-4">
        <Card className="summary-mini-card"><div className="mini-stat"><span className="mini-stat-value amount-positive">{formatCurrency(avgRevenue, true)}</span><span className="mini-stat-label">Avg Monthly Revenue</span></div></Card>
        <Card className="summary-mini-card"><div className="mini-stat"><span className="mini-stat-value amount-negative">{formatCurrency(avgExpenses, true)}</span><span className="mini-stat-label">Avg Monthly Expenses</span></div></Card>
        <Card className="summary-mini-card"><div className="mini-stat"><span className={`mini-stat-value ${health.revenueGrowth >= 0 ? 'amount-positive' : 'amount-negative'}`}>{formatPercentage(health.revenueGrowth)}</span><span className="mini-stat-label">Revenue Growth Rate</span></div></Card>
        <Card className="summary-mini-card"><div className="mini-stat"><span className={`mini-stat-value ${health.expenseGrowth <= 0 ? 'amount-positive' : 'amount-negative'}`}>{formatPercentage(health.expenseGrowth)}</span><span className="mini-stat-label">Expense Growth Rate</span></div></Card>
      </div>

      <div className="charts-grid">
        <Card title="Revenue Trend" className="chart-card">
          <div className="chart-container">
            <Line data={{
              labels: monthlyData.labels,
              datasets: [{
                label: 'Revenue', data: monthlyData.revenue,
                borderColor: CHART_COLORS.success, backgroundColor: 'rgba(16,185,129,0.1)',
                fill: true, tension: 0.4, pointRadius: 5,
              }],
            }} options={chartOpts} />
          </div>
        </Card>
        <Card title="Expense Trend" className="chart-card">
          <div className="chart-container">
            <Line data={{
              labels: monthlyData.labels,
              datasets: [{
                label: 'Expenses', data: monthlyData.expenses,
                borderColor: CHART_COLORS.danger, backgroundColor: 'rgba(239,68,68,0.1)',
                fill: true, tension: 0.4, pointRadius: 5,
              }],
            }} options={chartOpts} />
          </div>
        </Card>
        <Card title="Profit Trend" className="chart-card">
          <div className="chart-container">
            <Bar data={{
              labels: monthlyData.labels,
              datasets: [{
                label: 'Net Profit/Loss', data: monthlyData.profit,
                backgroundColor: monthlyData.profit.map((v) => v >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
                borderRadius: 6,
              }],
            }} options={chartOpts} />
          </div>
        </Card>
      </div>

      <div className="charts-grid grid-2">
        <Card title="Top Revenue Sources" className="chart-card">
          <div className="chart-container-sm">
            {revenueBreakdown.labels.length > 0 ? (
              <Doughnut data={{
                labels: revenueBreakdown.labels.slice(0, 6),
                datasets: [{ data: revenueBreakdown.values.slice(0, 6), backgroundColor: CHART_PALETTE, borderWidth: 0, hoverOffset: 8 }],
              }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', usePointStyle: true } } } }} />
            ) : <p className="no-data-text">No revenue data</p>}
          </div>
        </Card>
        <Card title="Top Expense Categories" className="chart-card">
          <div className="chart-container-sm">
            {expenseBreakdown.labels.length > 0 ? (
              <Doughnut data={{
                labels: expenseBreakdown.labels.slice(0, 6),
                datasets: [{ data: expenseBreakdown.values.slice(0, 6), backgroundColor: CHART_PALETTE, borderWidth: 0, hoverOffset: 8 }],
              }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', usePointStyle: true } } } }} />
            ) : <p className="no-data-text">No expense data</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
