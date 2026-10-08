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

// Initial sample data customized for Cimahi context so new users see a populated dashboard immediately
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    type: 'expense',
    category: 'Makanan & Minuman',
    amount: 18000,
    description: 'Sarapan Lontong Kari Baros Cimahi',
    paymentMethod: 'QRIS / E-Wallet',
    isSynced: false,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'tx-2',
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    type: 'expense',
    category: 'Bahan Pokok & Pasar',
    amount: 45000,
    description: 'Belanja sayur, tempe & telur di Pasar Antri Baru',
    paymentMethod: 'Tunai',
    isSynced: false,
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'tx-3',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '14:20',
    type: 'expense',
    category: 'Transportasi & Bensin',
    amount: 25000,
    description: 'Isi Pertalite SPBU Leuwigajah',
    paymentMethod: 'Tunai',
    isSynced: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'tx-4',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: '19:00',
    type: 'expense',
    category: 'Tagihan (Listrik/Air/WiFi)',
    amount: 150000,
    description: 'Token Listrik PLN Cimahi Tengah',
    paymentMethod: 'Transfer Bank',
    isSynced: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'tx-5',
    date: new Date().toISOString().slice(0, 7) + '-01',
    time: '09:00',
    type: 'income',
    category: 'Gaji Pokok / Uang Bulanan',
    amount: 3800000,
    description: 'Uang Bulanan / Gaji Awal Bulan',
    paymentMethod: 'Transfer Bank',
    isSynced: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
];

const DEFAULT_CONFIG: BudgetConfig = {
  monthlyBudget: 3500000,
  month: getCurrentMonthStr(),
  warningThresholdPct: 80,
  autoDailyLimit: true,
  customDailyLimit: 100000,
  cityContext: 'Kota Cimahi & KBB (Haji Ghofur, PakuHaji, Desa Cilame, Kec. Ngamprah, Cipageran)',
};

const DEFAULT_SYNC: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncedAt: null,
  pendingCount: 0,
  sheetsSpreadsheetId: null,
  sheetsSpreadsheetUrl: null,
  gasWebAppUrl: null,
  syncMode: 'oauth_sheets',
  syncLog: ['Aplikasi siap digunakan dalam mode offline-first.'],
};

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
        // Sample default goal for user in Cimahi
        const initialGoal: SavingsGoal = {
          id: 'goal-dana-darurat',
          title: 'Dana Darurat & Kebutuhan Masa Depan',
          targetAmount: 5000000,
          targetDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0], // 3 months ahead
          category: 'Dana Darurat',
          initialSavedAmount: 750000,
          surplusAllocationPct: 100,
          notes: 'Dipupuk dari sisa surplus kuota belanja & anggaran bulanan',
          createdAt: Date.now() - 86400000 * 10,
          updatedAt: Date.now() - 86400000 * 10,
        };
        this.saveSavingsGoals([initialGoal]);
        return [initialGoal];
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
