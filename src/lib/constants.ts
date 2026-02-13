import { NavItem } from './types';

export const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID || '1GfHcS3UACISvreLhRetpTyRCgTnVcqaV63zFCiZeR20';

export const COMPANY_INFO = {
  name: "Arneor Labs",
  website: "https://www.arneor.com",
  type: "Product-Based Software Company",
  industry: "Software Products & Research",
  toolName: "Arneor Vault",
  shortName: "Vault",
  established: "2024",
  partners: 3,
  currency: "INR",
  timezone: "Asia/Kolkata",
  financialYearStart: "April"
};

export const SHEET_NAMES = {
  PARTNERS: 'Partners',
  TRANSACTIONS: 'Transactions',
  BUDGETS: 'Budgets',
  TRANSFERS: 'Inter_Partner_Transfers',
  MONTHLY_SUMMARY: 'Monthly_Summary',
  SETTINGS: 'Settings',

};

// Kept for backward compatibility if needed, but prefer SHEET_NAMES
export const SHEETS = SHEET_NAMES;

export const INCOME_CATEGORIES = [
  'Product Sales Revenue',
  'Subscription Revenue',
  'Licensing Fees',
  'Partner Capital Injection',
  'Grants & Funding',
  'Pilot Program Revenue',
  'Other Income',
];

export const EXPENSE_CATEGORIES = [
  'R&D Costs',
  'Software Development Tools',
  'Infrastructure Costs',
  'Product Testing & QA',
  'Team Salaries',
  'Office & Operations',
  'Marketing & Product Launch',
  'Legal & IP Protection',
  'Hardware & Equipment',
  'Software Licenses & Subscriptions',
  'Prototyping Costs',
  'Travel & Conferences',
  'Miscellaneous Operating Expenses',
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI',
  'Corporate Card',
  'Partner Personal Card',
  'Cash',
  'Cheque',
  'Other',
];



export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Financial Overview', icon: 'LayoutDashboard' },
  { id: 'transactions', label: 'Income & Expenses', icon: 'ArrowLeftRight' },
  { id: 'income', label: 'Revenue', icon: 'TrendingUp' },
  { id: 'expenses', label: 'Expenses', icon: 'TrendingDown' },
  { id: 'partners', label: 'Partner Accounts', icon: 'Users' },

  { id: 'budgets', label: 'Budgets', icon: 'PieChart' },
  { id: 'cashflow', label: 'Cash Flow', icon: 'Activity' },
  { id: 'pnl', label: 'P&L Statement', icon: 'FileText' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'reports', label: 'Financial Reports', icon: 'ClipboardList' },
  { id: 'settings', label: 'System Settings', icon: 'Settings' },
];

export const CHART_COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  success: '#10b981',
  successLight: '#34d399',
  danger: '#ef4444',
  dangerLight: '#f87171',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  info: '#3b82f6',
  infoLight: '#60a5fa',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  cyan: '#06b6d4',
  lime: '#84cc16',
};

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.danger,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
  CHART_COLORS.lime,
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CURRENCY_SYMBOL = '₹';

export const DEFAULT_SETTINGS = {
  Currency: 'INR',
  Company_Name: 'Arneor Labs',
  Financial_Year_Start: 'April',
  Tax_Rate: '18',
  Low_Balance_Threshold: '50000',
  Auto_Refresh_Interval: '30',
};

export const API_CONFIG = {
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
  DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
};
