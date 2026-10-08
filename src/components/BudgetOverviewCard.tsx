import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Edit3,
  CalendarDays,
  ShieldCheck,
  PlusCircle,
  FileDown,
} from 'lucide-react';
import { BudgetConfig, DailyLimitStatus } from '../types/finance.ts';

interface BudgetOverviewCardProps {
  config: BudgetConfig;
  onUpdateConfig: (newConfig: BudgetConfig) => void;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  dailyStatus: DailyLimitStatus;
  onOpenAddModal: () => void;
  onOpenAdvisor: () => void;
  onOpenExportModal: () => void;
}

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
  config,
  onUpdateConfig,
  totalIncome,
  totalExpense,
  remainingBudget,
  dailyStatus,
  onOpenAddModal,
  onOpenAdvisor,
  onOpenExportModal,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(config.monthlyBudget.toString());

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(tempBudget.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateConfig({
        ...config,
        monthlyBudget: parsed,
      });
      setIsEditingBudget(false);
    }
  };

  const budgetUsagePercent = Math.min(
    100,
    Math.round((totalExpense / (config.monthlyBudget || 1)) * 100)
  );

  const dailyUsagePercent = Math.min(
    100,
    Math.round((dailyStatus.todayExpense / (dailyStatus.dailyLimit || 1)) * 100)
  );

  // Daily budget remaining calculation & Radial Progress Chart geometry
  const remainingDailyBudget = Math.max(0, dailyStatus.dailyLimit - dailyStatus.todayExpense);
  const remainingDailyPercent =
    dailyStatus.dailyLimit > 0
      ? Math.max(0, Math.min(100, Math.round((remainingDailyBudget / dailyStatus.dailyLimit) * 100)))
      : 0;

  const radialRadius = 38;
  const radialCircumference = 2 * Math.PI * radialRadius; // ~238.76
  const radialDashoffset =
    radialCircumference - (remainingDailyPercent / 100) * radialCircumference;

  return (
    <div className="space-y-4">
      {/* Primary Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top row: Month & Edit Budget */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Fokus Anggaran 30 Hari
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Periode {config.month}
              </span>
            </div>

            <button
              onClick={() => {
                setTempBudget(config.monthlyBudget.toString());
                setIsEditingBudget(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Target Anggaran</span>
            </button>
          </div>

          {/* Main Sisa Saldo Display */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-2">
              <p className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider">
                Sisa Anggaran Tersedia
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  Rp {remainingBudget.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                dari total target bulanan{' '}
                <span className="font-bold text-white">
                  Rp {config.monthlyBudget.toLocaleString('id-ID')}
                </span>{' '}
                ({budgetUsagePercent}% terpakai)
              </p>

              {/* Monthly budget progress bar */}
              <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUsagePercent > 90
                      ? 'bg-rose-500'
                      : budgetUsagePercent > 75
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </div>
            </div>

            {/* Quick Flow: Income vs Expense Cards */}
            <div className="md:col-span-5 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Pemasukan</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-slate-400">Total masuk bulan ini</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Pengeluaran</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-slate-400">Total keluar bulan ini</p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Transaksi Baru</span>
            </button>

            <button
              onClick={onOpenAdvisor}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-90 text-white transition active:scale-95 shadow-md shadow-teal-500/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Konsultasi AI Kang Tambal</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Laporan PDF & PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* 30-Day Daily Limit Pacing Section with Radial Progress Chart */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          dailyStatus.isOverBudget
            ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50'
            : dailyStatus.isWarning
            ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
            : 'bg-emerald-50/60 border-emerald-100 dark:bg-slate-900 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Column: Status Header, Info, & Metrics */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  dailyStatus.isOverBudget
                    ? 'bg-rose-500 text-white'
                    : dailyStatus.isWarning
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {dailyStatus.isOverBudget ? (
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                ) : dailyStatus.isWarning ? (
                  <Clock className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Pacing Anggaran 30 Hari & Limit Harian
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      dailyStatus.isOverBudget
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                        : dailyStatus.isWarning
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                    }`}
                  >
                    {dailyStatus.isOverBudget
                      ? 'MELEBIHI LIMIT'
                      : dailyStatus.isWarning
                      ? 'MENDEKATI LIMIT (≥80%)'
                      : 'AMAN TERKENDALI'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Hari ke-<strong className="text-slate-900 dark:text-white">{dailyStatus.currentDay}</strong> dari 30 hari.
                  Tersisa <strong className="text-slate-900 dark:text-white">{dailyStatus.remainingDays} hari</strong> untuk menjaga anggaran tetap cukup sampai akhir bulan.
                </p>
              </div>
            </div>

            {/* Daily Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Batas Limit Hari Ini
                </p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Rp {Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Terpakai Hari Ini
                </p>
                <p
                  className={`text-sm sm:text-base font-extrabold mt-0.5 ${
                    dailyStatus.isOverBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : dailyStatus.isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  Rp {dailyStatus.todayExpense.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  {dailyStatus.isOverBudget ? 'Defisit Hari Ini' : 'Sisa Kuota Hari Ini'}
                </p>
                <p
                  className={`text-sm sm:text-base font-extrabold mt-0.5 ${
                    dailyStatus.isOverBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : remainingDailyPercent <= 20
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {dailyStatus.isOverBudget
                    ? `- Rp ${(dailyStatus.todayExpense - dailyStatus.dailyLimit).toLocaleString('id-ID')}`
                    : `Rp ${remainingDailyBudget.toLocaleString('id-ID')}`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Radial Progress Chart */}
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs shrink-0 self-center sm:self-auto min-w-[170px]">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90 drop-shadow-2xs" viewBox="0 0 96 96">
                <defs>
                  <linearGradient id="radialProgressGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                  <linearGradient id="radialProgressAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="radialProgressRose" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
                {/* Background Track Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r={radialRadius}
                  className="stroke-slate-200/80 dark:stroke-slate-700/80"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Progress Arc Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r={radialRadius}
                  stroke={
                    dailyStatus.isOverBudget
                      ? 'url(#radialProgressRose)'
                      : remainingDailyPercent <= 20
                      ? 'url(#radialProgressAmber)'
                      : 'url(#radialProgressGreen)'
                  }
                  strokeWidth="7"
                  strokeDasharray={radialCircumference}
                  strokeDashoffset={radialDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              {/* Radial Center Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span
                  className={`text-xl font-black tracking-tight ${
                    dailyStatus.isOverBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : remainingDailyPercent <= 20
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {remainingDailyPercent}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 -mt-0.5">
                  Sisa Kuota
                </span>
              </div>
            </div>

            <div className="mt-2.5 text-center">
              <span
                className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  dailyStatus.isOverBudget
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                    : remainingDailyPercent <= 20
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                }`}
              >
                {dailyStatus.isOverBudget
                  ? 'Limit Habis'
                  : remainingDailyPercent <= 20
                  ? 'Perlu Berhemat'
                  : 'Alokasi Aman'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Atur Target Anggaran Bulanan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masukkan total budget bulanan (30 hari). Sistem akan membagi rata sisa anggaran per hari untuk Anda.
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Anggaran (Rp)
                </label>
                <input
                  type="text"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  placeholder="Contoh: 3500000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
