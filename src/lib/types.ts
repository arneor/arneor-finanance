// ============ Core Types ============

export interface Partner {
  Partner_ID: string;
  Partner_Name: string;
  Current_Balance: number;
  Phone: string;
  Email: string;
  Last_Updated: string;
}

export interface Transaction {
  Transaction_ID: string;
  Date: string;
  Type: 'Income' | 'Expense';
  Category: string;
  Amount: number;
  Partner_Account: string;
  Description: string;
  Payment_Method: string;
  Tags: string;
  Added_By: string;
  Timestamp: string;
}



export interface Budget {
  Category: string;
  Monthly_Budget: number;
  Quarterly_Budget: number;
  Yearly_Budget: number;
  Current_Spent: number;
  Remaining: number;
}

export interface InterPartnerTransfer {
  Transfer_ID: string;
  Date: string;
  From_Partner: string;
  To_Partner: string;
  Amount: number;
  Purpose: string;
  Timestamp: string;
}

export interface MonthlySummary {
  Month: string;
  Year: number;
  Total_Revenue: number;
  Total_Expenses: number;
  Net_Profit_Loss: number;
  Cash_Balance: number;
  Burn_Rate: number;
  Notes: string;
}

export interface Setting {
  Setting_Name: string;
  Setting_Value: string;
  Last_Modified: string;
}

// ============ Dashboard Metrics ============

export interface DashboardMetrics {
  totalCashAvailable: number;
  thisMonthRevenue: number;
  thisMonthExpenses: number;
  thisMonthProfitLoss: number;
  burnRate: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

// ============ Form Types ============

export interface TransactionFormData {
  Date: string;
  Type: 'Income' | 'Expense';
  Category: string;
  Amount: string;
  Partner_Account: string;
  Description: string;
  Payment_Method: string;
  Tags: string;
  Added_By: string;
}



export interface TransferFormData {
  From_Partner: string;
  To_Partner: string;
  Amount: string;
  Purpose: string;
}

export interface BudgetFormData {
  Category: string;
  Monthly_Budget: string;
  Quarterly_Budget: string;
  Yearly_Budget: string;
}

// ============ Filter Types ============

export interface TransactionFilters {
  dateFrom: string;
  dateTo: string;
  type: string;
  category: string;
  partner: string;
  amountMin: string;
  amountMax: string;
  search: string;
}

export type PageId =
  | 'dashboard'
  | 'transactions'
  | 'income'
  | 'expenses'
  | 'partners'
  | 'budgets'
  | 'reports'
  | 'cashflow'
  | 'analytics'
  | 'pnl'
  | 'settings'


export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
}

// ============ Alert Types ============

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

// ============ Financial Health ============

export interface FinancialHealth {
  score: number;
  operatingMargin: number;
  burnRate: number;
  runway: number;
  revenueGrowth: number;
  expenseGrowth: number;
}
