export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'Tunai' | 'QRIS / E-Wallet' | 'Transfer Bank' | 'Kartu Debit';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  isSynced: boolean;
  syncTimestamp?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetConfig {
  monthlyBudget: number; // e.g. Rp 3.500.000
  month: string; // YYYY-MM
  warningThresholdPct: number; // e.g. 80 (%)
  customDailyLimit?: number; // optional manual daily limit
  autoDailyLimit: boolean; // calculate remainingBudget / remainingDays
  cityContext: string; // "Cimahi & sekitarnya"
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncedAt: number | null;
  pendingCount: number;
  sheetsSpreadsheetId: string | null;
  sheetsSpreadsheetUrl: string | null;
  gasWebAppUrl: string | null;
  syncMode: 'oauth_sheets' | 'gas_webhook' | 'local_only';
  syncLog: string[];
}

export interface DailyLimitStatus {
  currentDay: number;
  daysInMonth: number;
  remainingDays: number;
  todayExpense: number;
  dailyLimit: number;
  percentage: number;
  isWarning: boolean;
  isOverBudget: boolean;
  remainingBudget: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  iconName: string;
}

export interface CategoryNotificationRule {
  id: string;
  category: string;
  thresholdAmount: number; // e.g. 500000
  period: 'monthly' | 'daily';
  isEnabled: boolean;
  createdAt: number;
}

export interface DailySmartTip {
  title: string;
  category: 'Pangan Hemat' | 'Promo Belanja' | 'Batas Harian' | 'Trik Cuan';
  summary: string;
  actionableAdvice: string;
  locationOrPlace: string;
  estimatedSavings: string;
}


export const EXPENSE_CATEGORIES = [
  { id: 'makanan', name: 'Makanan & Minuman', color: '#f59e0b', icon: 'Utensils' },
  { id: 'belanja_dapur', name: 'Bahan Pokok & Pasar', color: '#10b981', icon: 'ShoppingBag' },
  { id: 'transportasi', name: 'Transportasi & Bensin', color: '#3b82f6', icon: 'Car' },
  { id: 'tagihan', name: 'Tagihan (Listrik/Air/WiFi)', color: '#8b5cf6', icon: 'Zap' },
  { id: 'kesehatan', name: 'Kesehatan & Obat', color: '#ec4899', icon: 'HeartPulse' },
  { id: 'pendidikan', name: 'Pendidikan & Kursus', color: '#06b6d4', icon: 'GraduationCap' },
  { id: 'hiburan', name: 'Hiburan & Santai', color: '#f43f5e', icon: 'Smile' },
  { id: 'cicilan', name: 'Cicilan & Utang', color: '#ef4444', icon: 'CreditCard' },
  { id: 'sosial', name: 'Sosial & Sedekah', color: '#14b8a6', icon: 'HandHeart' },
  { id: 'lainnya', name: 'Pengeluaran Lainnya', color: '#6b7280', icon: 'MoreHorizontal' },
] as const;

export const INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji Pokok / Uang Bulanan', color: '#10b981', icon: 'Wallet' },
  { id: 'bisnis', name: 'Usaha & Jualan Online', color: '#059669', icon: 'Store' },
  { id: 'freelance', name: 'Freelance & Sampingan', color: '#0d9488', icon: 'Briefcase' },
  { id: 'bonus', name: 'Bonus / THR / Hadiah', color: '#eab308', icon: 'Gift' },
  { id: 'investasi', name: 'Investasi & Dividen', color: '#6366f1', icon: 'TrendingUp' },
  { id: 'lainnya_masuk', name: 'Pemasukan Lainnya', color: '#6b7280', icon: 'MoreHorizontal' },
] as const;

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  initialSavedAmount?: number;
  surplusAllocationPct?: number; // e.g., percentage of unused surplus allocated (0-100)
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
