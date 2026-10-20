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
import { SavingsGoalsSection } from './components/SavingsGoalsSection.tsx';
import { AchievementsView } from './components/AchievementsView.tsx';
import { LocalMarketPromoSection } from './components/LocalMarketPromoSection.tsx';
import { GoogleSyncModal } from './components/GoogleSyncModal.tsx';
import { CalendarReminderModal } from './components/CalendarReminderModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { EndOfMonthRecapModal } from './components/EndOfMonthRecapModal.tsx';
import { FirstTimeOnboardingModal } from './components/FirstTimeOnboardingModal.tsx';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'promo' | 'analytics' | 'compliance'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<{
    type?: 'income' | 'expense';
    category?: string;
    amount?: number;
    description?: string;
  } | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      const done = localStorage.getItem('mber_first_time_onboarding_done');
      return !done;
    } catch {
      return false;
    }
  });
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = useCallback((title: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const handleCompleteOnboarding = (monthlyBudget: number) => {
    const currentCfg = FinanceDB.getBudgetConfig();
    const updatedCfg = {
      ...currentCfg,
      monthlyBudget,
    };
    FinanceDB.saveBudgetConfig(updatedCfg);
    setBudgetConfig(updatedCfg);
    try {
      localStorage.setItem('mber_first_time_onboarding_done', 'true');
    } catch {
      // ignore
    }
    setIsOnboardingOpen(false);
    showToast(
      `Selamat datang di M-Ber! Uang bulanan masuk Rp ${monthlyBudget.toLocaleString('id-ID')} berhasil disetel.`,
      'success'
    );
  };

  const handleSkipOnboarding = () => {
    try {
      localStorage.setItem('mber_first_time_onboarding_done', 'true');
    } catch {
      // ignore
    }
    setIsOnboardingOpen(false);
    showToast(
      'Form onboarding dilewati. Data tersimpan secara offline di perangkat ini (tidak tersimpan ke Google Sheets).',
      'info'
    );
  };

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

  // Initialize Firebase Auth for Google Workspace integration with diagnostic logging
  useEffect(() => {
    // Run diagnostic check on mount to inspect window location vs Firebase authorized domain for Vercel
    GoogleSheetsService.logAuthEnvironmentDiagnostics('Firebase Auth Initialization');

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

  // Check and execute automatic reset on the 1st of each month (or when month changes)
  useEffect(() => {
    const runMonthlyResetCheck = () => {
      const res = FinanceDB.checkAndPerformMonthlyAutoReset();
      if (res.hasReset) {
        setBudgetConfig(FinanceDB.getBudgetConfig());
        setTransactions(FinanceDB.getTransactions());
        showToast(
          `🗓️ Periode Baru ${res.newMonth}: Anggaran M-Ber telah otomatis di-reset untuk tanggal 1. Pengeluaran dimulai dari Rp 0!`,
          'info'
        );
        NotificationService.push(
          '🗓️ Siklus Anggaran Baru (Tanggal 1)',
          `Selamat datang di periode ${res.newMonth}! Sesuai pengaturan M-Ber, pencatatan belanja bulan ini otomatis di-reset ke Rp 0. Arsip bulan sebelumnya tetap tersimpan di riwayat.`,
          'info'
        );
      }
    };

    // 1. Check immediately upon mount
    runMonthlyResetCheck();

    // 2. Listen to custom simulation / manual monthly reset events
    const handleMonthlyResetEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      const detail = customEvt.detail || {};
      setBudgetConfig(FinanceDB.getBudgetConfig());
      setTransactions(FinanceDB.getTransactions());
      showToast(
        `🗓️ Periode ${detail.newMonth || ''}: Siklus anggaran berhasil di-reset untuk tanggal 1. Pengeluaran dimulai dari Rp 0!`,
        'success'
      );
    };
    window.addEventListener('finance_monthly_reset_occurred', handleMonthlyResetEvent);

    // 3. Periodic check every 60 seconds & on tab visibility change
    const interval = setInterval(runMonthlyResetCheck, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runMonthlyResetCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('finance_monthly_reset_occurred', handleMonthlyResetEvent);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [showToast]);

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
      throw err;
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    showToast('Berhasil keluar dari akun Google.', 'info');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white">
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

      {/* Desktop Navigation Tabs: Positioned sticky below header on laptops/PCs */}
      <div className="hidden md:block sticky top-16 z-30">
        <BottomNavbar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          transactionCount={transactions.length}
        />
      </div>

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

      {/* Main Content Area - Mobile Optimized */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
        {/* VIEW 1: Overview (Default - Streamlined & Focused) */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
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
              onOpenCompliance={() => setActiveTab('compliance')}
              onOpenPromo={() => setActiveTab('promo')}
              onOpenExportModal={() => setActiveTab('analytics')}
              onOpenRecapModal={() => setIsRecapModalOpen(true)}
            />

            {/* Recent Transactions List */}
            <div className="space-y-3">
              <TransactionList
                transactions={transactions.slice(0, 8)}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            </div>

            {/* Savings Goals Powered by Unused Budget Surplus */}
            <SavingsGoalsSection
              savingsGoals={savingsGoals}
              onAddGoal={handleAddSavingsGoal}
              onUpdateGoal={handleUpdateSavingsGoal}
              onDeleteGoal={handleDeleteSavingsGoal}
              unusedBudgetSurplus={remainingBudget}
              monthlyBudget={budgetConfig.monthlyBudget}
            />
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

        {/* VIEW 3: Promo & Pasar Lokal (Dedicated Tab - 100% Gratis Seluruh Indonesia) */}
        {activeTab === 'promo' && (
          <LocalMarketPromoSection
            cityContext={budgetConfig.cityContext}
            onUpdateCityContext={(newCity) => {
              const newCfg = { ...budgetConfig, cityContext: newCity };
              FinanceDB.saveBudgetConfig(newCfg);
              setBudgetConfig(newCfg);
              showToast(`Wilayah belanja diubah ke: ${newCity}`, 'success');
            }}
            onOpenAddTransaction={(prefillDesc, prefillCat) => {
              setFormInitialData({
                description: prefillDesc,
                category: prefillCat || 'Makanan & Minuman',
              });
              setIsAddModalOpen(true);
            }}
            onToast={showToast}
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

        {/* VIEW 4: Rapor Belanja Bunda & Medali Hemat (Didukung Rewarded Ads) */}
        {activeTab === 'compliance' && (
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
            onToast={showToast}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navbar: Guaranteed sticky bottom on smartphones, never disappears when scrolling */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 z-50 mt-auto transform-gpu translate-z-0">
        <BottomNavbar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          transactionCount={transactions.length}
        />
      </div>

      {/* Modals and Drawers */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormInitialData(null);
        }}
        onSubmit={handleAddTransaction}
        dailyStatus={dailyStatus}
        initialData={formInitialData}
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
          setActiveTab('compliance');
        }}
        onUpdateConfig={(newCfg) => {
          FinanceDB.saveBudgetConfig(newCfg);
          showToast('Target anggaran bulan baru berhasil disimpan!', 'success');
        }}
        onToast={showToast}
      />

      {/* First Time User Onboarding Modal (Uang Bulanan Masuk & Google Account Sync) */}
      <FirstTimeOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  );
}
