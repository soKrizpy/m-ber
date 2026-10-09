import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  BarChart3,
  Sparkles,
  CloudUpload,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  X,
  Award,
} from 'lucide-react';
import {
  Transaction,
  BudgetConfig,
  SyncStatus,
  DailyLimitStatus,
  CategorySummary,
  EXPENSE_CATEGORIES,
  SavingsGoal,
} from './types/finance.ts';
import { FinanceDB, getCurrentMonthStr } from './services/db.ts';
import { initAuth, googleSignIn, logout as googleLogout } from './services/googleAuth.ts';
import { GoogleSheetsService } from './services/googleSheets.ts';
import { NotificationService, AppNotification } from './services/notifications.ts';
import { Navbar } from './components/Navbar.tsx';
import { BottomNavbar } from './components/BottomNavbar.tsx';
import { BudgetOverviewCard } from './components/BudgetOverviewCard.tsx';
import { TransactionFormModal } from './components/TransactionFormModal.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { GeminiAdvisorView } from './components/GeminiAdvisorView.tsx';
import { CimahiBudgetChatbot } from './components/CimahiBudgetChatbot.tsx';
import { DailySmartTipsSection } from './components/DailySmartTipsSection.tsx';
import { SavingsGoalsSection } from './components/SavingsGoalsSection.tsx';
import { GoogleSyncModal } from './components/GoogleSyncModal.tsx';
import { CalendarReminderModal } from './components/CalendarReminderModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { EndOfMonthRecapModal } from './components/EndOfMonthRecapModal.tsx';
import { AchievementsView } from './components/AchievementsView.tsx';
import { User } from 'firebase/auth';

export default function App() {
  // Theme state: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem('catatcuan_theme_mode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      // If user previously had stored dark theme preference
      const storedLegacy = localStorage.getItem('catatcuan_dark_theme');
      if (storedLegacy === 'false') return 'light';
      if (storedLegacy === 'true') return 'dark';
      // Default to light mode as requested
      return 'light';
    } catch {
      return 'light';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Listen to OS theme changes if user selects 'system'
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('catatcuan_theme_mode', themeMode);
      localStorage.setItem('catatcuan_dark_theme', isDark ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isDark, themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const currentlyDark = prev === 'system' ? systemPrefersDark : prev === 'dark';
      return currentlyDark ? 'light' : 'dark';
    });
  }, [systemPrefersDark]);

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>(() => FinanceDB.getTransactions());
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => FinanceDB.getBudgetConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => FinanceDB.getSyncStatus());
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => FinanceDB.getSavingsGoals());
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    NotificationService.getInAppNotifications()
  );

  // Auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // Active view tab & modals
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics' | 'achievements' | 'gemini'>('overview');
  const [geminiMode, setGeminiMode] = useState<'chatbot' | 'audit'>('chatbot');
  const [chatbotPrefillPrompt, setChatbotPrefillPrompt] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = useCallback((title: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Listen to DB and Storage events
  useEffect(() => {
    const handleDbUpdate = () => {
      setTransactions(FinanceDB.getTransactions());
      setSyncStatus(FinanceDB.getSyncStatus());
    };
    const handleConfigUpdate = () => {
      setBudgetConfig(FinanceDB.getBudgetConfig());
    };
    const handleSyncUpdate = () => {
      setSyncStatus(FinanceDB.getSyncStatus());
    };
    const handleSavingsUpdate = () => {
      setSavingsGoals(FinanceDB.getSavingsGoals());
    };
    const handleNotifUpdate = () => {
      setNotifications(NotificationService.getInAppNotifications());
    };

    window.addEventListener('finance_db_updated', handleDbUpdate);
    window.addEventListener('finance_config_updated', handleConfigUpdate);
    window.addEventListener('finance_sync_updated', handleSyncUpdate);
    window.addEventListener('finance_savings_updated', handleSavingsUpdate);
    window.addEventListener('app_notifications_updated', handleNotifUpdate);

    // Online / Offline listeners
    const handleOnline = () => {
      const s = FinanceDB.getSyncStatus();
      s.isOnline = true;
      FinanceDB.saveSyncStatus(s);
      setSyncStatus(s);
      showToast('Koneksi internet terhubung kembali. Memeriksa antrean sinkronisasi...', 'info');

      // Auto sync if there's pending items and OAuth is active
      if (s.sheetsSpreadsheetId && googleUser && s.pendingCount > 0) {
        GoogleSheetsService.syncDirectOAuth(
          FinanceDB.getTransactions(),
          FinanceDB.getBudgetConfig(),
          s.sheetsSpreadsheetId
        ).then(() => {
          showToast('Data offline berhasil disinkronkan otomatis ke Google Sheets!', 'success');
        }).catch((e) => {
          console.warn('Auto sync failed:', e);
        });
      }
    };

    const handleOffline = () => {
      const s = FinanceDB.getSyncStatus();
      s.isOnline = false;
      FinanceDB.saveSyncStatus(s);
      setSyncStatus(s);
      showToast('Mode offline aktif: Semua pencatatan tetap tersimpan aman di perangkat Anda.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('finance_db_updated', handleDbUpdate);
      window.removeEventListener('finance_config_updated', handleConfigUpdate);
      window.removeEventListener('finance_sync_updated', handleSyncUpdate);
      window.removeEventListener('finance_savings_updated', handleSavingsUpdate);
      window.removeEventListener('app_notifications_updated', handleNotifUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [googleUser, showToast]);

  // Initialize Firebase Auth for Google Workspace integration
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filter current month transactions
  const currentMonthTransactions = useMemo(() => {
    const currentPrefix = budgetConfig.month || getCurrentMonthStr();
    return transactions.filter((t) => t.date.startsWith(currentPrefix));
  }, [transactions, budgetConfig.month]);

  // Aggregate Metrics
  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const remainingBudget = Math.max(0, budgetConfig.monthlyBudget - totalExpense);

  // Today's Expense
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayExpense = useMemo(() => {
    return transactions
      .filter((t) => t.date === todayStr && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayStr]);

  // Daily Limit Status (30-day budget focus)
  const dailyStatus: DailyLimitStatus = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // usually 30 or 31
    const currentDay = now.getDate();
    const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

    // Daily limit is calculated from remaining budget divided by remaining days
    const dailyLimit = budgetConfig.autoDailyLimit
      ? Math.max(0, remainingBudget / remainingDays)
      : budgetConfig.customDailyLimit || 100000;

    const percentage = dailyLimit > 0 ? (todayExpense / dailyLimit) * 100 : 0;
    const isWarning = percentage >= (budgetConfig.warningThresholdPct || 80);
    const isOverBudget = todayExpense > dailyLimit && dailyLimit > 0;

    return {
      currentDay,
      daysInMonth,
      remainingDays,
      todayExpense,
      dailyLimit,
      percentage,
      isWarning,
      isOverBudget,
      remainingBudget,
    };
  }, [budgetConfig, remainingBudget, todayExpense]);

  // End of Month Check: last 5 days of the month (remainingDays <= 5)
  const isEndOfMonth = dailyStatus.remainingDays <= 5;

  // Auto trigger End-of-Month recap pop-up once per day when near the end of month
  useEffect(() => {
    if (isEndOfMonth) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      const promptKey = `mber_recap_popup_shown_${budgetConfig.month}_${todayDateStr}`;
      const alreadyPrompted = localStorage.getItem(promptKey);

      if (!alreadyPrompted) {
        const timer = setTimeout(() => {
          setIsRecapModalOpen(true);
          localStorage.setItem(promptKey, 'true');
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isEndOfMonth, budgetConfig.month]);

  // Category Breakdown
  const categoriesSummary: CategorySummary[] = useMemo(() => {
    const expenseList = currentMonthTransactions.filter((t) => t.type === 'expense');
    const total = expenseList.reduce((sum, t) => sum + t.amount, 0) || 1;
    const catMap: Record<string, { amount: number; count: number }> = {};

    expenseList.forEach((t) => {
      if (!catMap[t.category]) {
        catMap[t.category] = { amount: 0, count: 0 };
      }
      catMap[t.category].amount += t.amount;
      catMap[t.category].count += 1;
    });

    return Object.entries(catMap)
      .map(([name, val]) => {
        const found = EXPENSE_CATEGORIES.find((c) => c.name === name);
        return {
          category: name,
          amount: val.amount,
          percentage: (val.amount / total) * 100,
          count: val.count,
          color: found ? found.color : '#6b7280',
          iconName: found ? found.icon : 'ShoppingBag',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  // Category expenses map for quick lookup and settings rules
  const categoryExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [currentMonthTransactions]);

  // Handle adding transaction
  const handleAddTransaction = (data: {
    type: 'expense' | 'income';
    category: string;
    amount: number;
    description: string;
    paymentMethod: any;
    date: string;
    time: string;
  }) => {
    const newTx = FinanceDB.addTransaction(data);

    // Check daily limit warning & custom category rules
    if (data.type === 'expense') {
      const newTodayExpense = todayExpense + data.amount;
      NotificationService.checkDailyLimitWarning(
        newTodayExpense,
        dailyStatus.dailyLimit,
        dailyStatus.remainingDays
      );
      NotificationService.checkCategoryRules(
        FinanceDB.getTransactions(),
        budgetConfig.month
      );
    }

    showToast(
      `${data.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'} Rp ${data.amount.toLocaleString(
        'id-ID'
      )} berhasil dicatat!`,
      'success'
    );

    // Real-time sync attempt if connected to Google Sheets
    if (syncStatus.isOnline && syncStatus.sheetsSpreadsheetId && googleUser) {
      GoogleSheetsService.syncDirectOAuth(
        FinanceDB.getTransactions(),
        budgetConfig,
        syncStatus.sheetsSpreadsheetId
      )
        .then(() => {
          showToast('Data otomatis tersinkronkan ke Google Sheets.', 'info');
        })
        .catch((err) => {
          console.warn('Real-time sync queued for retry:', err);
        });
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = (id: string) => {
    FinanceDB.deleteTransaction(id);
    showToast('Catatan transaksi telah dihapus.', 'info');

    // Trigger background sync if connected
    if (syncStatus.isOnline && syncStatus.sheetsSpreadsheetId && googleUser) {
      GoogleSheetsService.syncDirectOAuth(
        FinanceDB.getTransactions(),
        budgetConfig,
        syncStatus.sheetsSpreadsheetId
      ).catch(() => {});
    }
  };

  // Savings goals handlers
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    FinanceDB.addSavingsGoal(goalData);
    showToast(`Target tabungan "${goalData.title}" berhasil dibuat!`, 'success');
  };

  const handleUpdateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    FinanceDB.updateSavingsGoal(id, updates);
    showToast('Target tabungan berhasil diperbarui.', 'success');
  };

  const handleDeleteSavingsGoal = (id: string) => {
    FinanceDB.deleteSavingsGoal(id);
    showToast('Target tabungan telah dihapus.', 'info');
  };

  // Google sign in / out
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        showToast(`Selamat datang, ${res.user.displayName || res.user.email}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal masuk dengan akun Google', 'warning');
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    showToast('Berhasil keluar dari akun Google.', 'info');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white pb-24 md:pb-10">
      {/* Top Navbar */}
      <Navbar
        isDark={isDark}
        onToggleDark={toggleTheme}
        syncStatus={syncStatus}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenRecapModal={() => setIsRecapModalOpen(true)}
        isEndOfMonth={isEndOfMonth}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleLogout={handleGoogleLogout}
        onNavigateHome={() => setActiveTab('overview')}
      />

      {/* Floating Offline Notification Banner */}
      {!syncStatus.isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Mode Offline Aktif — Anda tetap bisa mencatat transaksi tanpa hambatan. Data tersimpan di HP/perangkat dan otomatis sinkron ke Google Sheets saat internet kembali.
          </span>
        </div>
      )}

      {/* Navigation Bar:
          - Fixed at bottom on mobile screen (visible from the very beginning)
          - Positioned up below header on larger screens (laptop/PC, outside header)
      */}
      <BottomNavbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        transactionCount={transactions.length}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between space-x-3 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage.title}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: Overview (Default) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* End of Month Prompt Callout Banner */}
            {isEndOfMonth && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-in fade-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/25 flex items-center justify-center font-black text-slate-950 shrink-0 shadow-xs">
                    <Award className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                      🗓️ Penghujung Bulan Tiba! Waktunya Rekap Evaluasi Keuangan
                    </h3>
                    <p className="text-xs text-slate-950/90 font-medium">
                      Sisa {dailyStatus.remainingDays} hari. Rekap pengeluaran, klaim medali prestasimu, dan unduh infografis metrik (PNG/PDF).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRecapModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-slate-950 text-white hover:bg-slate-900 transition flex items-center justify-center space-x-2 shrink-0 shadow-md cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Rekap Bulanan Sekarang</span>
                </button>
              </div>
            )}

            <BudgetOverviewCard
              config={budgetConfig}
              onUpdateConfig={(newCfg) => {
                FinanceDB.saveBudgetConfig(newCfg);
                showToast('Target anggaran berhasil diperbarui.', 'success');
              }}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              remainingBudget={remainingBudget}
              dailyStatus={dailyStatus}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenAdvisor={() => setActiveTab('gemini')}
              onOpenExportModal={() => setActiveTab('analytics')}
              onOpenRecapModal={() => setIsRecapModalOpen(true)}
            />

            {/* Daily AI-Generated Smart Spending Tips for Cimahi */}
            <DailySmartTipsSection
              config={budgetConfig}
              dailyStatus={dailyStatus}
              transactions={currentMonthTransactions}
              remainingBudget={remainingBudget}
              onAskChatbotWithTip={(tipText) => {
                setChatbotPrefillPrompt(tipText);
                setGeminiMode('chatbot');
                setActiveTab('gemini');
              }}
            />

            {/* Savings Goals Powered by Unused Budget Surplus */}
            <SavingsGoalsSection
              savingsGoals={savingsGoals}
              onAddGoal={handleAddSavingsGoal}
              onUpdateGoal={handleUpdateSavingsGoal}
              onDeleteGoal={handleDeleteSavingsGoal}
              unusedBudgetSurplus={remainingBudget}
              monthlyBudget={budgetConfig.monthlyBudget}
            />

            {/* Quick Preview of Recent Transactions & AI Teaser */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <TransactionList
                  transactions={transactions.slice(0, 8)}
                  onDeleteTransaction={handleDeleteTransaction}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                />
              </div>

              {/* Cimahi AI Advisor Widget Quickbox */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-900/90 to-emerald-950 text-white border border-teal-800/40 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Konsultasi Anggaran Cimahi & KBB</h3>
                      <p className="text-[11px] text-teal-200">Didukung Gemini AI</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    Sisa waktu bulan ini <strong>{dailyStatus.remainingDays} hari</strong>. Ingin rekomendasi belanja bahan pangan murah di Pasar Atas / Jl. Haji Ghofur atau promo diskon Borma & supermarket Cilame - Cipageran?
                  </p>

                  <button
                    onClick={() => setActiveTab('gemini')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 transition shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tanya Kang Tambal Sekarang</span>
                  </button>
                </div>

                {/* Google Sync Status Widget */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Status Google Sheets
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        syncStatus.sheetsSpreadsheetId
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {syncStatus.sheetsSpreadsheetId ? 'Terkoneksi' : 'Lokal Saja'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {syncStatus.pendingCount > 0
                      ? `Ada ${syncStatus.pendingCount} transaksi dalam antrean sinkronisasi.`
                      : 'Seluruh data tersinkron rapi di Google Sheets.'}
                  </p>

                  <button
                    onClick={() => setIsSyncModalOpen(true)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-center space-x-1.5"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Kelola Sinkronisasi Sheets</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Transactions Full */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {/* VIEW 3: Analytics & PDF */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            config={budgetConfig}
            transactions={currentMonthTransactions}
            dailyStatus={dailyStatus}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            remainingBudget={remainingBudget}
            categories={categoriesSummary}
            onOpenRecapModal={() => setIsRecapModalOpen(true)}
          />
        )}

        {/* VIEW 4: Prestasi & Pencapaian Finansial (Achievements Page) */}
        {activeTab === 'achievements' && (
          <AchievementsView
            config={budgetConfig}
            transactions={currentMonthTransactions}
            dailyStatus={dailyStatus}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            remainingBudget={remainingBudget}
            categories={categoriesSummary}
            onOpenRecapModal={() => setIsRecapModalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* VIEW 5: Gemini Advisor (Kang Tambal - Chatbot & Audit) */}
        {activeTab === 'gemini' && (
          <div className="space-y-4">
            {/* Mode Switcher Pills */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <button
                  onClick={() => setGeminiMode('chatbot')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    geminiMode === 'chatbot'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Chatbot Interaktif Cimahi</span>
                </button>
                <button
                  onClick={() => setGeminiMode('audit')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    geminiMode === 'audit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Audit & Rekomendasi 30 Hari</span>
                </button>
              </div>
            </div>

            {geminiMode === 'chatbot' ? (
              <CimahiBudgetChatbot
                config={budgetConfig}
                transactions={currentMonthTransactions}
                dailyStatus={dailyStatus}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                remainingBudget={remainingBudget}
                categories={categoriesSummary}
                initialPrompt={chatbotPrefillPrompt}
                onClearInitialPrompt={() => setChatbotPrefillPrompt(null)}
              />
            ) : (
              <GeminiAdvisorView
                config={budgetConfig}
                transactions={currentMonthTransactions}
                dailyStatus={dailyStatus}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                remainingBudget={remainingBudget}
                categories={categoriesSummary}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals and Drawers */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
        dailyStatus={dailyStatus}
      />

      <GoogleSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncStatus={syncStatus}
        transactions={transactions}
        budgetConfig={budgetConfig}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleLogout={handleGoogleLogout}
        onSyncSuccess={(msg) => showToast(msg, 'success')}
      />

      <CalendarReminderModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onClearAll={() => {
          NotificationService.clearAll();
          showToast('Semua notifikasi telah dibersihkan.', 'info');
        }}
        onMarkRead={() => {
          NotificationService.markAllAsRead();
          showToast('Semua notifikasi ditandai telah dibaca.', 'info');
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={budgetConfig}
        onUpdateConfig={(newCfg) => {
          FinanceDB.saveBudgetConfig(newCfg);
          showToast('Pengaturan anggaran berhasil disimpan.', 'success');
        }}
        categoryExpenses={categoryExpensesMap}
        onRulesChanged={() => {
          NotificationService.checkCategoryRules(transactions, budgetConfig.month);
          showToast('Aturan notifikasi kategori diperbarui.', 'info');
        }}
        themeMode={themeMode}
        onThemeModeChange={(mode) => {
          setThemeMode(mode);
          showToast(
            mode === 'light'
              ? 'Mode Terang (Light Mode) diaktifkan.'
              : mode === 'dark'
              ? 'Mode Gelap (Dark Mode) diaktifkan.'
              : 'Tema Otomatis (Mengikuti Sistem) diaktifkan.',
            'info'
          );
        }}
      />

      {/* End of Month Recap & Reminder Modal */}
      <EndOfMonthRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        config={budgetConfig}
        transactions={currentMonthTransactions}
        dailyStatus={dailyStatus}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        remainingBudget={remainingBudget}
        categories={categoriesSummary}
        onOpenAdvisor={() => {
          setActiveTab('gemini');
        }}
        onOpenAchievements={() => {
          setActiveTab('achievements');
        }}
        onUpdateConfig={(newCfg) => {
          FinanceDB.saveBudgetConfig(newCfg);
          showToast('Target anggaran bulan baru berhasil disimpan!', 'success');
        }}
        onToast={showToast}
      />
    </div>
  );
}
