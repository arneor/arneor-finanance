/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Partner,
  Transaction,
  Budget,
  InterPartnerTransfer,
  MonthlySummary,
  Setting,
} from './types';
import { SPREADSHEET_ID, SHEETS } from './constants';

// ============ Google API Loader ============

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
console.log('FinManage Config:', {
  clientIdLoaded: !!CLIENT_ID,
  clientIdPrefix: CLIENT_ID.substring(0, 5) + '...',
  spreadsheetIdsLoaded: !!process.env.NEXT_PUBLIC_SPREADSHEET_ID
});
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: any = null;

// ============ Cache System ============

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

export function clearCache(): void {
  cache.clear();
}

// ============ Retry Logic ============

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      if (error?.status === 429) {
        await new Promise((r) => setTimeout(r, delay * (i + 1) * 2));
      } else {
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
      }
    }
  }
  throw new Error('Max retries reached');
}

// ============ Init & Auth ============


export function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';

    script.onload = () => {
      if (!(window as any).gapi) {
        reject(new Error('Google API Script loaded but window.gapi is undefined'));
        return;
      }
      (window as any).gapi.load('client', async () => {
        try {
          const initConfig: any = {
            discoveryDocs: [
              'https://sheets.googleapis.com/$discovery/rest?version=v4',
            ],
          };

          // Only attach API Key if it looks valid (Google API Keys typically start with AIza)
          // The user currently has an invalid key (AQ.Ab8...) which causes init to fail.
          // By omitting the invalid key, we allow the app to load and rely on OAuth (Client ID) for access.
          if (API_KEY && API_KEY.startsWith('AIza')) {
            initConfig.apiKey = API_KEY;
          } else {
            console.warn('Skipping invalid Google API Key format. Expecting key starting with "AIza". Proceeding with OAuth only.');
          }

          await (window as any).gapi.client.init(initConfig);
          gapiLoaded = true;
          resolve();
        } catch (err: any) {
          console.error('GAPI init error:', err);
          reject(new Error(`GAPI init failed: ${err?.message || JSON.stringify(err)}`));
        }
      });
    };

    script.onerror = () => reject(new Error('Failed to load Google API script (https://apis.google.com/js/api.js)'));
    document.head.appendChild(script);
  });
}

export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisLoaded) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      if (!(window as any).google) {
        reject(new Error('Google Identity Script loaded but window.google is undefined'));
        return;
      }
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script (https://accounts.google.com/gsi/client)'));
    document.head.appendChild(script);
  });
}


export function initTokenClient(
  onSuccess: () => void,
  onError: (err: any) => void
): void {

  const gapi = (window as any).gapi;
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: `${SCOPES} https://www.googleapis.com/auth/userinfo.email`,
    callback: (response: any) => {
      if (response.error) {
        onError(response);
        return;
      }
      // Save token to localStorage
      if (response.access_token) {
        const tokenData = {
          access_token: response.access_token,
          expires_in: parseInt(response.expires_in),
          timestamp: Date.now()
        };

        localStorage.setItem('gapi_token', JSON.stringify(tokenData));

        // CRITAL FIX: Set successful token to gapi client immediately
        // allowing immediate requests (like userinfo) to succeed.
        gapi.client.setToken(response);
      }
      onSuccess();
    },
  });

  // Try to restore token
  const savedToken = localStorage.getItem('gapi_token');
  if (savedToken) {
    try {
      const tokenData = JSON.parse(savedToken);
      const now = Date.now();
      // Check if expired (buffer 1 minute)
      if (now - tokenData.timestamp < (tokenData.expires_in * 1000 - 60000)) {
        gapi.client.setToken({ access_token: tokenData.access_token });
        // Trigger success immediately if GAPI is already loaded
        if (gapiLoaded) onSuccess();
        // If GAPI not loaded yet, caller handles waiting, but we have the token ready
      } else {
        localStorage.removeItem('gapi_token');
      }
    } catch (e) {
      console.error('Error restoring token', e);
      localStorage.removeItem('gapi_token');
    }
  }
}

export function requestAccessToken(): void {
  if (!tokenClient) {
    throw new Error('Token client not initialized');
  }
  const gapi = (window as any).gapi;
  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

export function revokeToken(): void {
  const gapi = (window as any).gapi;
  const token = gapi.client.getToken();
  if (token !== null) {
    (window as any).google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);
  }
}

export function isAuthenticated(): boolean {
  try {
    const gapi = (window as any).gapi;
    return gapi?.client?.getToken() !== null;
  } catch {
    return false;
  }
}

// ============ Sheet Operations ============

async function readSheet(range: string): Promise<any[][]> {
  const gapi = (window as any).gapi;
  const response = await withRetry(() =>
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })
  );
  return (response as any).result.values || [];
}

async function appendToSheet(range: string, values: any[][]): Promise<any> {
  const gapi = (window as any).gapi;
  return withRetry(() =>
    gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values },
    })
  );
}

async function updateSheet(range: string, values: any[][]): Promise<any> {
  const gapi = (window as any).gapi;
  return withRetry(() =>
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    })
  );
}

async function sheetExists(sheetName: string): Promise<boolean> {
  try {
    const gapi = (window as any).gapi;
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheets = response.result.sheets || [];
    return sheets.some(
      (s: any) => s.properties.title === sheetName
    );
  } catch {
    return false;
  }
}

async function createSheet(sheetName: string): Promise<void> {
  const gapi = (window as any).gapi;
  await withRetry(() =>
    gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      },
    })
  );
}

// ============ Initialize Sheet Structure ============

const SHEET_HEADERS: Record<string, string[]> = {
  [SHEETS.PARTNERS]: [
    'Partner_ID', 'Partner_Name', 'Current_Balance', 'Phone', 'Email', 'Last_Updated',
  ],
  [SHEETS.TRANSACTIONS]: [
    'Transaction_ID', 'Date', 'Type', 'Category', 'Amount', 'Partner_Account',
    'Description', 'Payment_Method', 'Tags', 'Added_By', 'Timestamp',
  ],
  [SHEETS.BUDGETS]: [
    'Category', 'Monthly_Budget', 'Quarterly_Budget', 'Yearly_Budget',
    'Current_Spent', 'Remaining',
  ],
  [SHEETS.TRANSFERS]: [
    'Transfer_ID', 'Date', 'From_Partner', 'To_Partner', 'Amount', 'Purpose', 'Timestamp',
  ],
  [SHEETS.MONTHLY_SUMMARY]: [
    'Month', 'Year', 'Total_Revenue', 'Total_Expenses', 'Net_Profit_Loss',
    'Cash_Balance', 'Burn_Rate', 'Notes',
  ],
  [SHEETS.SETTINGS]: ['Setting_Name', 'Setting_Value', 'Last_Modified'],
};

export async function initializeSheets(): Promise<void> {
  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    const exists = await sheetExists(sheetName);
    if (!exists) {
      await createSheet(sheetName);
      await updateSheet(`${sheetName}!A1`, [headers]);
    }
  }

  // Initialize default partners if empty
  const partners = await fetchPartners();
  if (partners.length === 0) {
    const defaultPartners = [
      ['P001', 'Nidhin', '0', '', 'lalnidhinp02@gmail.com', new Date().toISOString()],
      ['P002', 'Mark', '0', '', 'askmarkmorph@gmail.com', new Date().toISOString()],
      ['P003', 'Business Account', '0', '', '', new Date().toISOString()],
    ];
    await appendToSheet(`${SHEETS.PARTNERS}!A:F`, defaultPartners);
    clearCache(); // Clear cache to reflect new partners immediately
  }
}

// ============ Partners CRUD ============

export async function fetchPartners(): Promise<Partner[]> {
  const cached = getCached<Partner[]>('partners');
  if (cached) return cached;

  const data = await readSheet(`${SHEETS.PARTNERS}!A:F`);
  if (data.length <= 1) return [];

  const partners = data.slice(1).map((row) => ({
    Partner_ID: row[0] || '',
    Partner_Name: row[1] || '',
    Current_Balance: parseFloat(row[2]) || 0,
    Phone: row[3] || '',
    Email: row[4] || '',
    Last_Updated: row[5] || '',
  }));

  setCache('partners', partners);
  return partners;
}

export async function updatePartner(
  rowIndex: number,
  partner: Partial<Partner>
): Promise<void> {
  const range = `${SHEETS.PARTNERS}!A${rowIndex + 2}:F${rowIndex + 2}`;
  const partners = await fetchPartners();
  const existing = partners[rowIndex];
  const updated = { ...existing, ...partner, Last_Updated: new Date().toISOString() };
  await updateSheet(range, [
    [
      updated.Partner_ID,
      updated.Partner_Name,
      updated.Current_Balance.toString(),
      updated.Phone,
      updated.Email,
      updated.Last_Updated,
    ],
  ]);
  clearCache();
}

export async function updatePartnerBalance(
  partnerId: string,
  amountChange: number
): Promise<void> {
  const partners = await fetchPartners();
  const idx = partners.findIndex((p) => p.Partner_ID === partnerId);
  if (idx === -1) throw new Error(`Partner ${partnerId} not found`);

  const newBalance = partners[idx].Current_Balance + amountChange;
  await updatePartner(idx, { Current_Balance: newBalance });
}

// ============ Transactions CRUD ============

export async function fetchTransactions(): Promise<Transaction[]> {
  const cached = getCached<Transaction[]>('transactions');
  if (cached) return cached;

  const data = await readSheet(`${SHEETS.TRANSACTIONS}!A:K`);
  if (data.length <= 1) return [];

  const transactions = data.slice(1).map((row) => ({
    Transaction_ID: row[0] || '',
    Date: row[1] || '',
    Type: (row[2] || 'Expense') as 'Income' | 'Expense',
    Category: row[3] || '',
    Amount: parseFloat(row[4]) || 0,
    Partner_Account: row[5] || '',
    Description: row[6] || '',
    Payment_Method: row[7] || '',
    Tags: row[8] || '',
    Added_By: row[9] || '',
    Timestamp: row[10] || '',
  }));

  setCache('transactions', transactions);
  return transactions;
}

export async function addTransaction(
  tx: Omit<Transaction, 'Transaction_ID' | 'Timestamp'>
): Promise<void> {
  const transactions = await fetchTransactions();
  const id = `TXN${String(transactions.length + 1).padStart(4, '0')}`;
  const timestamp = new Date().toISOString();

  await appendToSheet(`${SHEETS.TRANSACTIONS}!A:K`, [
    [
      id, tx.Date, tx.Type, tx.Category, tx.Amount.toString(),
      tx.Partner_Account, tx.Description, tx.Payment_Method,
      tx.Tags, tx.Added_By, timestamp,
    ],
  ]);

  // Update partner balance
  const amountChange = tx.Type === 'Income' ? tx.Amount : -tx.Amount;
  if (tx.Partner_Account) {
    await updatePartnerBalance(tx.Partner_Account, amountChange);
  }

  clearCache();
}

export async function updateTransaction(
  rowIndex: number,
  tx: Transaction
): Promise<void> {
  const range = `${SHEETS.TRANSACTIONS}!A${rowIndex + 2}:K${rowIndex + 2}`;
  await updateSheet(range, [
    [
      tx.Transaction_ID, tx.Date, tx.Type, tx.Category,
      tx.Amount.toString(), tx.Partner_Account, tx.Description,
      tx.Payment_Method, tx.Tags, tx.Added_By, tx.Timestamp,
    ],
  ]);
  clearCache();
}

export async function deleteTransaction(rowIndex: number): Promise<void> {
  const gapi = (window as any).gapi;

  // 1. Fetch transaction details to update balance
  const transactions = await fetchTransactions();
  const tx = transactions[rowIndex];

  if (tx && tx.Partner_Account) {
    // If we delete an income, balance goes down. If expense, balance goes up.
    const amountChange = tx.Type === 'Income' ? -tx.Amount : tx.Amount;
    await updatePartnerBalance(tx.Partner_Account, amountChange);
  }

  // 2. Delete the row
  const response = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheets = response.result.sheets || [];
  const sheet = sheets.find((s: any) => s.properties.title === SHEETS.TRANSACTIONS);

  if (!sheet) throw new Error(`Sheet ${SHEETS.TRANSACTIONS} not found`);
  const sheetId = sheet.properties.sheetId;

  await withRetry(() =>
    gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // Header is row 0, first data row is row 1
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    })
  );
  clearCache();
}

// ============ Budgets CRUD ============

export async function fetchBudgets(): Promise<Budget[]> {
  const cached = getCached<Budget[]>('budgets');
  if (cached) return cached;

  const data = await readSheet(`${SHEETS.BUDGETS}!A:F`);
  if (data.length <= 1) return [];

  const budgets = data.slice(1).map((row) => ({
    Category: row[0] || '',
    Monthly_Budget: parseFloat(row[1]) || 0,
    Quarterly_Budget: parseFloat(row[2]) || 0,
    Yearly_Budget: parseFloat(row[3]) || 0,
    Current_Spent: parseFloat(row[4]) || 0,
    Remaining: parseFloat(row[5]) || 0,
  }));

  setCache('budgets', budgets);
  return budgets;
}

export async function addBudget(budget: Budget): Promise<void> {
  await appendToSheet(`${SHEETS.BUDGETS}!A:F`, [
    [
      budget.Category, budget.Monthly_Budget.toString(),
      budget.Quarterly_Budget.toString(), budget.Yearly_Budget.toString(),
      budget.Current_Spent.toString(), budget.Remaining.toString(),
    ],
  ]);
  clearCache();
}

export async function updateBudget(
  rowIndex: number,
  budget: Budget
): Promise<void> {
  const range = `${SHEETS.BUDGETS}!A${rowIndex + 2}:F${rowIndex + 2}`;
  await updateSheet(range, [
    [
      budget.Category, budget.Monthly_Budget.toString(),
      budget.Quarterly_Budget.toString(), budget.Yearly_Budget.toString(),
      budget.Current_Spent.toString(), budget.Remaining.toString(),
    ],
  ]);
  clearCache();
}

export async function deleteBudget(rowIndex: number): Promise<void> {
  const gapi = (window as any).gapi;

  // First get the sheetId
  const response = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheets = response.result.sheets || [];
  const sheet = sheets.find((s: any) => s.properties.title === SHEETS.BUDGETS);

  if (!sheet) throw new Error(`Sheet ${SHEETS.BUDGETS} not found`);
  const sheetId = sheet.properties.sheetId;

  await withRetry(() =>
    gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // Header is row 0, first data row is row 1
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    })
  );
  clearCache();
}

// ============ Inter-Partner Transfers ============

export async function fetchTransfers(): Promise<InterPartnerTransfer[]> {
  const cached = getCached<InterPartnerTransfer[]>('transfers');
  if (cached) return cached;

  const data = await readSheet(`${SHEETS.TRANSFERS}!A:G`);
  if (data.length <= 1) return [];

  const transfers = data.slice(1).map((row) => ({
    Transfer_ID: row[0] || '',
    Date: row[1] || '',
    From_Partner: row[2] || '',
    To_Partner: row[3] || '',
    Amount: parseFloat(row[4]) || 0,
    Purpose: row[5] || '',
    Timestamp: row[6] || '',
  }));

  setCache('transfers', transfers);
  return transfers;
}

export async function addTransfer(
  transfer: Omit<InterPartnerTransfer, 'Transfer_ID' | 'Timestamp'>
): Promise<void> {
  const transfers = await fetchTransfers();
  const id = `TRF${String(transfers.length + 1).padStart(4, '0')}`;
  const timestamp = new Date().toISOString();

  await appendToSheet(`${SHEETS.TRANSFERS}!A:G`, [
    [
      id, transfer.Date, transfer.From_Partner, transfer.To_Partner,
      transfer.Amount.toString(), transfer.Purpose, timestamp,
    ],
  ]);

  // Update both partner balances
  await updatePartnerBalance(transfer.From_Partner, -transfer.Amount);
  await updatePartnerBalance(transfer.To_Partner, transfer.Amount);

  clearCache();
}

// ============ Monthly Summary ============

export async function fetchMonthlySummaries(): Promise<MonthlySummary[]> {
  const cached = getCached<MonthlySummary[]>('monthly_summary');
  if (cached) return cached;

  const data = await readSheet(`${SHEETS.MONTHLY_SUMMARY}!A:H`);
  if (data.length <= 1) return [];

  const summaries = data.slice(1).map((row) => ({
    Month: row[0] || '',
    Year: parseInt(row[1]) || 0,
    Total_Revenue: parseFloat(row[2]) || 0,
    Total_Expenses: parseFloat(row[3]) || 0,
    Net_Profit_Loss: parseFloat(row[4]) || 0,
    Cash_Balance: parseFloat(row[5]) || 0,
    Burn_Rate: parseFloat(row[6]) || 0,
    Notes: row[7] || '',
  }));

  setCache('monthly_summary', summaries);
  return summaries;
}

// ============ Settings ============

export async function fetchSettings(): Promise<Setting[]> {
  const cached = getCached<Setting[]>('settings');
  if (cached) return cached;

  const data = await readSheet(`${SHEETS.SETTINGS}!A:C`);
  if (data.length <= 1) return [];

  const settings = data.slice(1).map((row) => ({
    Setting_Name: row[0] || '',
    Setting_Value: row[1] || '',
    Last_Modified: row[2] || '',
  }));

  setCache('settings', settings);
  return settings;
}

export async function updateSetting(
  name: string,
  value: string
): Promise<void> {
  const settings = await fetchSettings();
  const idx = settings.findIndex((s) => s.Setting_Name === name);
  if (idx === -1) {
    await appendToSheet(`${SHEETS.SETTINGS}!A:C`, [
      [name, value, new Date().toISOString()],
    ]);
  } else {
    const range = `${SHEETS.SETTINGS}!B${idx + 2}:C${idx + 2}`;
    await updateSheet(range, [[value, new Date().toISOString()]]);
  }
  clearCache();
}


// ============ ALL Data Fetch ============

export async function fetchAllData() {
  clearCache();
  const [partners, transactions, budgets, transfers, monthlySummaries, settings] =
    await Promise.all([
      fetchPartners(),
      fetchTransactions(),
      fetchBudgets(),
      fetchTransfers(),
      fetchMonthlySummaries(),
      fetchSettings(),
    ]);

  return {
    partners,
    transactions,
    budgets,
    transfers,
    monthlySummaries,
    settings,
  };
}
