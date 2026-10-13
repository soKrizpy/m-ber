import { Transaction, BudgetConfig, SyncStatus, SavingsGoal } from '../types/finance.ts';

const STORAGE_KEY_TRANSACTIONS = 'catatcuan_transactions_v1';
const STORAGE_KEY_CONFIG = 'catatcuan_budget_config_v1';
const STORAGE_KEY_SYNC = 'catatcuan_sync_status_v1';
const STORAGE_KEY_PENDING_QUEUE = 'catatcuan_pending_sync_queue_v1';
const STORAGE_KEY_SAVINGS_GOALS = 'catatcuan_savings_goals_v1';

// Format current month YYYY-MM
export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Initial transactions: clean slate starting from 0
const INITIAL_TRANSACTIONS: Transaction[] = [];

const DEFAULT_CONFIG: BudgetConfig = {
  monthlyBudget: 0,
  month: getCurrentMonthStr(),
  warningThresholdPct: 80,
  autoDailyLimit: true,
  customDailyLimit: 0,
  cityContext: 'Kota Cimahi & KBB (Haji Ghofur, PakuHaji, Desa Cilame, Kec. Ngamprah, Cipageran)',
  autoMonthlyReset: true,
  lastAutoResetAt: new Date().toISOString(),
};

const DEFAULT_SYNC: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncedAt: null,
  pendingCount: 0,
  sheetsSpreadsheetId: null,
  sheetsSpreadsheetUrl: null,
  gasWebAppUrl: null,
  syncMode: 'oauth_sheets',
  syncLog: ['Aplikasi siap digunakan dalam mode offline-first (Saldo awal 0).'],
};

// Automatic one-time reset execution to enforce 0 for existing sessions
const RESET_ZERO_TAG = 'm_ber_reset_all_numbers_zero_v6';
if (typeof window !== 'undefined' && !localStorage.getItem(RESET_ZERO_TAG)) {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_SAVINGS_GOALS, JSON.stringify([]));
    const rawCfg = localStorage.getItem(STORAGE_KEY_CONFIG);
    const existing = rawCfg ? JSON.parse(rawCfg) : DEFAULT_CONFIG;
    localStorage.setItem(
      STORAGE_KEY_CONFIG,
      JSON.stringify({
        ...existing,
        monthlyBudget: 0,
        customDailyLimit: 0,
      })
    );
    localStorage.removeItem(STORAGE_KEY_PENDING_QUEUE);
    localStorage.setItem(RESET_ZERO_TAG, 'true');
  } catch (e) {
    console.warn('Auto reset to zero error:', e);
  }
}

export class FinanceDB {
  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (!data) {
        this.saveTransactions(INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    window.dispatchEvent(new Event('finance_db_updated'));
  }

  static addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Transaction {
    const list = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSynced: false,
    };
    list.unshift(newTx);
    this.saveTransactions(list);
    this.enqueuePendingSync(newTx.id, 'add');
    return newTx;
  }

  static updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const list = this.getTransactions();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: Date.now(),
      isSynced: false,
    };
    this.saveTransactions(list);
    this.enqueuePendingSync(id, 'update');
    return list[idx];
  }

  static deleteTransaction(id: string): boolean {
    const list = this.getTransactions();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length !== list.length) {
      this.saveTransactions(filtered);
      this.enqueuePendingSync(id, 'delete');
      return true;
    }
    return false;
  }

  static getBudgetConfig(): BudgetConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (!data) {
        this.saveBudgetConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static saveBudgetConfig(config: BudgetConfig) {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new Event('finance_config_updated'));
  }

  static getSyncStatus(): SyncStatus {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SYNC);
      const pending = this.getPendingSyncQueue();
      const currentOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!data) {
        const initial = { ...DEFAULT_SYNC, isOnline: currentOnline, pendingCount: pending.length };
        this.saveSyncStatus(initial);
        return initial;
      }
      return {
        ...DEFAULT_SYNC,
        ...JSON.parse(data),
        isOnline: currentOnline,
        pendingCount: pending.length,
      };
    } catch {
      return DEFAULT_SYNC;
    }
  }

  static saveSyncStatus(status: SyncStatus) {
    localStorage.setItem(STORAGE_KEY_SYNC, JSON.stringify(status));
    window.dispatchEvent(new Event('finance_sync_updated'));
  }

  static getPendingSyncQueue(): Array<{ id: string; action: 'add' | 'update' | 'delete'; timestamp: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PENDING_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static enqueuePendingSync(id: string, action: 'add' | 'update' | 'delete') {
    const queue = this.getPendingSyncQueue();
    // Remove previous pending for same id
    const filtered = queue.filter((item) => item.id !== id);
    filtered.push({ id, action, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY_PENDING_QUEUE, JSON.stringify(filtered));
    
    // Update sync status count
    const status = this.getSyncStatus();
    status.pendingCount = filtered.length;
    this.saveSyncStatus(status);
  }

  static clearPendingSyncQueue() {
    localStorage.removeItem(STORAGE_KEY_PENDING_QUEUE);
    const status = this.getSyncStatus();
    status.pendingCount = 0;
    this.saveSyncStatus(status);
  }

  static markAllTransactionsSynced() {
    const list = this.getTransactions();
    const updated = list.map((t) => ({ ...t, isSynced: true, syncTimestamp: Date.now() }));
    this.saveTransactions(updated);
    this.clearPendingSyncQueue();
  }

  static logSync(message: string) {
    const status = this.getSyncStatus();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log = [`[${timeStr}] ${message}`, ...(status.syncLog || []).slice(0, 19)];
    status.syncLog = log;
    this.saveSyncStatus(status);
  }

  // --- Savings Goals Management ---
  static getSavingsGoals(): SavingsGoal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SAVINGS_GOALS);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveSavingsGoals(goals: SavingsGoal[]) {
    localStorage.setItem(STORAGE_KEY_SAVINGS_GOALS, JSON.stringify(goals));
    window.dispatchEvent(new Event('finance_savings_updated'));
  }

  static resetAllDataToZero() {
    if (typeof window === 'undefined') return;
    this.saveTransactions([]);
    this.saveBudgetConfig({
      ...DEFAULT_CONFIG,
      monthlyBudget: 0,
      customDailyLimit: 0,
    });
    this.saveSavingsGoals([]);
    localStorage.removeItem(STORAGE_KEY_PENDING_QUEUE);

    const sync = this.getSyncStatus();
    sync.pendingCount = 0;
    this.saveSyncStatus(sync);

    window.dispatchEvent(new Event('finance_db_updated'));
    window.dispatchEvent(new Event('finance_config_updated'));
    window.dispatchEvent(new Event('finance_savings_updated'));
    window.dispatchEvent(new Event('finance_sync_updated'));
  }

  /**
   * Checks if today is the 1st of a new month (or if the active budget month has changed)
   * and automatically resets the active monthly cycle to 0 expenses for the new month.
   */
  static checkAndPerformMonthlyAutoReset(): { hasReset: boolean; oldMonth: string; newMonth: string } {
    if (typeof window === 'undefined') return { hasReset: false, oldMonth: '', newMonth: '' };
    const config = this.getBudgetConfig();
    const currentMonth = getCurrentMonthStr();

    // Auto reset is enabled by default unless user explicitly turned it off
    const isAutoResetEnabled = config.autoMonthlyReset !== false;

    if (isAutoResetEnabled && config.month && config.month !== currentMonth) {
      const oldMonth = config.month;
      const updatedConfig: BudgetConfig = {
        ...config,
        month: currentMonth,
        customDailyLimit: 0,
        lastAutoResetAt: new Date().toISOString(),
      };
      this.saveBudgetConfig(updatedConfig);

      // Dispatch event for UI notifications
      window.dispatchEvent(
        new CustomEvent('finance_monthly_reset_occurred', {
          detail: { oldMonth, newMonth: currentMonth, source: 'auto_1st_of_month' },
        })
      );
      window.dispatchEvent(new Event('finance_db_updated'));

      return { hasReset: true, oldMonth, newMonth: currentMonth };
    }

    return { hasReset: false, oldMonth: config.month, newMonth: currentMonth };
  }

  /**
   * Simulates or executes an immediate reset to a target month (or next month)
   * so users can test and verify the 1st of month auto-reset feature anytime.
   */
  static simulateMonthlyReset(targetMonth?: string): { oldMonth: string; newMonth: string } {
    const config = this.getBudgetConfig();
    const oldMonth = config.month || getCurrentMonthStr();

    let nextMonth = targetMonth;
    if (!nextMonth) {
      const [yearStr, monthStr] = oldMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const nextDate = new Date(y, m, 1); // 1st of next month
      nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    }

    const updatedConfig: BudgetConfig = {
      ...config,
      month: nextMonth,
      customDailyLimit: 0,
      lastAutoResetAt: new Date().toISOString(),
    };
    this.saveBudgetConfig(updatedConfig);

    window.dispatchEvent(
      new CustomEvent('finance_monthly_reset_occurred', {
        detail: { oldMonth, newMonth: nextMonth, source: 'manual_simulation' },
      })
    );
    window.dispatchEvent(new Event('finance_db_updated'));

    return { oldMonth, newMonth: nextMonth };
  }

  /**
   * Resets active transactions in the current month back to Rp 0
   */
  static resetCurrentMonthTransactionsToZero(): number {
    const config = this.getBudgetConfig();
    const currentPrefix = config.month || getCurrentMonthStr();
    const all = this.getTransactions();
    const remaining = all.filter((t) => !t.date.startsWith(currentPrefix));
    const deletedCount = all.length - remaining.length;
    this.saveTransactions(remaining);
    return deletedCount;
  }

  static addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): SavingsGoal {
    const list = this.getSavingsGoals();
    const newGoal: SavingsGoal = {
      ...goal,
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    list.push(newGoal);
    this.saveSavingsGoals(list);
    return newGoal;
  }

  static updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): SavingsGoal | null {
    const list = this.getSavingsGoals();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveSavingsGoals(list);
    return list[idx];
  }

  static deleteSavingsGoal(id: string): boolean {
    const list = this.getSavingsGoals();
    const filtered = list.filter((g) => g.id !== id);
    if (filtered.length !== list.length) {
      this.saveSavingsGoals(filtered);
      return true;
    }
    return false;
  }
}
