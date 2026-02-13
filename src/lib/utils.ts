import { Transaction, Partner, DashboardMetrics, FinancialHealth } from './types';
import { MONTHS, CURRENCY_SYMBOL } from './constants';

// ============ Date Utilities ============

/**
 * Parses a date string that may be:
 * - A Google Sheets serial day number (e.g. "46066")
 * - An ISO timestamp (e.g. "2026-02-13T10:30:54.653")
 * - A standard date string (e.g. "2026-02-13")
 * Google Sheets serial dates count days since December 30, 1899.
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // If the value is purely numeric (possibly with decimals), treat as Sheets serial
  const trimmed = dateStr.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = parseFloat(trimmed);
    // Google Sheets epoch: December 30, 1899
    const sheetsEpoch = new Date(1899, 11, 30);
    const ms = sheetsEpoch.getTime() + serial * 86400000;
    return new Date(ms);
  }

  // Otherwise use standard Date parsing
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateInput(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function getMonthYear(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function isCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  const d = parseDate(dateStr);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function getMonthsBetween(start: Date, end: Date): { month: string; year: number }[] {
  const months: { month: string; year: number }[] = [];
  const d = new Date(start);
  while (d <= end) {
    months.push({ month: MONTHS[d.getMonth()], year: d.getFullYear() });
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

export function getLast6Months(): { month: string; year: number; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: MONTHS[d.getMonth()],
      year: d.getFullYear(),
      label: `${MONTHS[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`,
    });
  }
  return result;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ============ Number / Currency Formatting ============

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 10000000) return `${CURRENCY_SYMBOL}${(amount / 10000000).toFixed(1)}Cr`;
    if (Math.abs(amount) >= 100000) return `${CURRENCY_SYMBOL}${(amount / 100000).toFixed(1)}L`;
    if (Math.abs(amount) >= 1000) return `${CURRENCY_SYMBOL}${(amount / 1000).toFixed(1)}K`;
  }
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

export function formatPercentage(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ============ Dashboard Metrics ============

export function calculateDashboardMetrics(
  partners: Partner[],
  transactions: Transaction[]
): DashboardMetrics {
  const totalCash = partners.reduce((s, p) => s + p.Current_Balance, 0);

  const currentMonthTxns = transactions.filter((t) => isCurrentMonth(t.Date));
  const revenue = currentMonthTxns.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
  const expenses = currentMonthTxns.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);

  // Calculate burn rate (average monthly expenses over last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentExpenses = transactions
    .filter((t) => t.Type === 'Expense' && parseDate(t.Date) >= sixMonthsAgo)
    .reduce((s, t) => s + t.Amount, 0);
  const burnRate = recentExpenses / 6;

  return {
    totalCashAvailable: totalCash,
    thisMonthRevenue: revenue,
    thisMonthExpenses: expenses,
    thisMonthProfitLoss: revenue - expenses,
    burnRate,
  };
}

// ============ Monthly Aggregation ============

export function getMonthlyData(
  transactions: Transaction[],
  months: number = 6
): { labels: string[]; revenue: number[]; expenses: number[]; profit: number[] } {
  const ranges = getLast6Months().slice(-(months));
  const labels: string[] = [];
  const revenue: number[] = [];
  const expenses: number[] = [];
  const profit: number[] = [];

  for (const { month, year, label } of ranges) {
    const monthTxns = transactions.filter((t) => {
      const d = parseDate(t.Date);
      return MONTHS[d.getMonth()] === month && d.getFullYear() === year;
    });

    const rev = monthTxns.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
    const exp = monthTxns.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);

    labels.push(label);
    revenue.push(rev);
    expenses.push(exp);
    profit.push(rev - exp);
  }

  return { labels, revenue, expenses, profit };
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  type: 'Income' | 'Expense'
): { labels: string[]; values: number[] } {
  const filtered = transactions.filter((t) => t.Type === type);
  const categoryMap = new Map<string, number>();

  for (const t of filtered) {
    categoryMap.set(t.Category, (categoryMap.get(t.Category) || 0) + t.Amount);
  }

  const sorted = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
  return {
    labels: sorted.map(([k]) => k),
    values: sorted.map(([, v]) => v),
  };
}

// ============ Financial Health ============

export function calculateFinancialHealth(
  partners: Partner[],
  transactions: Transaction[]
): FinancialHealth {
  const totalCash = partners.reduce((s, p) => s + p.Current_Balance, 0);
  
  const now = new Date();
  const thisMonthTxns = transactions.filter((t) => isCurrentMonth(t.Date));
  const thisMonthRevenue = thisMonthTxns.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
  const thisMonthExpenses = thisMonthTxns.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);

  // Last month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthTxns = transactions.filter((t) => {
    const d = parseDate(t.Date);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  });
  const lastMonthRevenue = lastMonthTxns.filter((t) => t.Type === 'Income').reduce((s, t) => s + t.Amount, 0);
  const lastMonthExpenses = lastMonthTxns.filter((t) => t.Type === 'Expense').reduce((s, t) => s + t.Amount, 0);

  const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const expenseGrowth = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

  const operatingMargin = thisMonthRevenue > 0 ? ((thisMonthRevenue - thisMonthExpenses) / thisMonthRevenue) * 100 : 0;

  // Calculate burn rate and runway
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentExpenses = transactions
    .filter((t) => t.Type === 'Expense' && parseDate(t.Date) >= sixMonthsAgo)
    .reduce((s, t) => s + t.Amount, 0);
  const burnRate = recentExpenses / 6;
  const runway = burnRate > 0 ? totalCash / burnRate : 999;

  // Financial health score (0-100) - Simplified without debt metrics
  let score = 50;
  if (operatingMargin > 20) score += 20;
  else if (operatingMargin > 0) score += 10;
  else score -= 15;
  
  if (runway > 12) score += 20;
  else if (runway < 3) score -= 20;
  
  if (revenueGrowth > 10) score += 10;
  
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    operatingMargin,
    burnRate,
    runway,
    revenueGrowth,
    expenseGrowth,
  };
}

// ============ Settlement Calculations ============

// Settlements calculation removed

// ============ Cash Flow Projection ============

export function projectCashFlow(
  currentBalance: number,
  transactions: Transaction[],
  months: number = 3
): { labels: string[]; projected: number[]; actual: number[] } {
  const now = new Date();
  const monthlyData = getMonthlyData(transactions, 6);

  const avgRevenue = monthlyData.revenue.reduce((s, v) => s + v, 0) / Math.max(monthlyData.revenue.length, 1);
  const avgExpenses = monthlyData.expenses.reduce((s, v) => s + v, 0) / Math.max(monthlyData.expenses.length, 1);
  const avgNetFlow = avgRevenue - avgExpenses;

  const labels: string[] = [];
  const projected: number[] = [];
  const actual: number[] = [];

  // Historical
  let runningBalance = currentBalance;
  for (let i = monthlyData.labels.length - 1; i >= 0; i--) {
    runningBalance -= (monthlyData.revenue[i] - monthlyData.expenses[i]);
  }
  for (let i = 0; i < monthlyData.labels.length; i++) {
    runningBalance += (monthlyData.revenue[i] - monthlyData.expenses[i]);
    labels.push(monthlyData.labels[i]);
    actual.push(runningBalance);
    projected.push(runningBalance);
  }

  // Projections
  let projBalance = currentBalance;
  for (let i = 1; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(`${MONTHS[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`);
    projBalance += avgNetFlow;
    projected.push(projBalance);
    actual.push(NaN); // No actual data for future months
  }

  return { labels, projected, actual };
}

// ============ ID Generation ============

export function generateId(prefix: string, existingItems: { [key: string]: unknown }[]): string {
  const num = existingItems.length + 1;
  return `${prefix}${String(num).padStart(4, '0')}`;
}

// ============ Validation ============

export function validateAmount(value: string): string | null {
  const num = parseFloat(value);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Amount must be positive';
  return null;
}

export function validateDate(value: string): string | null {
  if (!value) return 'Date is required';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Invalid date';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
}

// ============ Export Helpers ============

export function downloadCSV<T extends object>(data: T[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]) as (keyof T)[];
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = String((row as Record<string, unknown>)[h as string] ?? '');
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============ Misc ============

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}
