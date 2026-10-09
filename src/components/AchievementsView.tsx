import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wallet,
  TrendingUp,
  Target,
  FileDown,
  ArrowRight,
  Flame,
  Info,
  Share2,
  Heart,
} from 'lucide-react';
import {
  BudgetConfig,
  Transaction,
  DailyLimitStatus,
  CategorySummary,
} from '../types/finance.ts';

interface AchievementsViewProps {
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
  onOpenRecapModal: () => void;
  onNavigateTab: (tab: 'overview' | 'transactions' | 'analytics' | 'achievements' | 'gemini') => void;
}

export interface AchievementItem {
  id: string;
  title: string;
  category: 'budget' | 'discipline' | 'savings' | 'smart';
  desc: string;
  requirement: string;
  icon: string;
  unlocked: boolean;
  rewardBadge: string;
  progressText?: string;
  progressPercent: number;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  config,
  transactions,
  dailyStatus,
  totalIncome,
  totalExpense,
  remainingBudget,
  categories,
  onOpenRecapModal,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isUnderBudget = totalExpense <= config.monthlyBudget;
  const budgetDifference = config.monthlyBudget - totalExpense;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsagePercent = config.monthlyBudget > 0
    ? Math.round((totalExpense / config.monthlyBudget) * 100)
    : 0;

  // Financial Health Score (0 - 100)
  let healthScore = 70;
  if (isUnderBudget) healthScore += 15;
  if (savingsRate >= 20) healthScore += 10;
  else if (savingsRate >= 10) healthScore += 5;
  else if (savingsRate < 0) healthScore -= 20;

  if (transactions.length >= 10) healthScore += 5;
  if (budgetUsagePercent > 100) healthScore -= Math.min(30, (budgetUsagePercent - 100) * 1.5);
  healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

  let healthGrade = 'B';
  let healthGradeLabel = 'Cukup Baik & Terkendali';
  let healthGradeBadgeColor = 'bg-blue-500 text-white';

  if (healthScore >= 90) {
    healthGrade = 'A+';
    healthGradeLabel = 'Sangat Sehat & Mengagumkan!';
    healthGradeBadgeColor = 'bg-emerald-500 text-white shadow-emerald-500/30';
  } else if (healthScore >= 80) {
    healthGrade = 'A';
    healthGradeLabel = 'Sehat & Hemat';
    healthGradeBadgeColor = 'bg-teal-500 text-white shadow-teal-500/30';
  } else if (healthScore >= 70) {
    healthGrade = 'B';
    healthGradeLabel = 'Cukup Stabil';
    healthGradeBadgeColor = 'bg-blue-500 text-white shadow-blue-500/30';
  } else {
    healthGrade = 'C';
    healthGradeLabel = 'Perlu Penataan Ulang';
    healthGradeBadgeColor = 'bg-rose-500 text-white shadow-rose-500/30';
  }

  // 8 Defined Achievements
  const achievements: AchievementItem[] = [
    {
      id: 'budget_champion',
      title: 'Pahlawan Anggaran (Budget Hero)',
      category: 'budget',
      desc: 'Disiplin menjaga total pengeluaran bulanan tidak melampaui batas pagu anggaran.',
      requirement: `Belanja tidak lebih dari Rp ${config.monthlyBudget.toLocaleString('id-ID')}`,
      icon: '🏆',
      unlocked: isUnderBudget && config.monthlyBudget > 0,
      rewardBadge: 'Hemat Juara',
      progressText: `${budgetUsagePercent}% terpakai dari 100%`,
      progressPercent: Math.min(100, budgetUsagePercent),
    },
    {
      id: 'surplus_guardian',
      title: 'Benteng Tabungan (Surplus Guard)',
      category: 'savings',
      desc: 'Berhasil mengamankan sisa dana lebih dari 15% dari total anggaran awal.',
      requirement: 'Sisa saldo di atas 15% dari target bulanan',
      icon: '🛡️',
      unlocked: budgetDifference >= config.monthlyBudget * 0.15 && isUnderBudget,
      rewardBadge: 'Dana Aman',
      progressText: budgetDifference > 0
        ? `Tersisa Rp ${budgetDifference.toLocaleString('id-ID')}`
        : 'Belum ada sisa',
      progressPercent: isUnderBudget ? Math.min(100, Math.round((budgetDifference / (config.monthlyBudget || 1)) * 100 * (100 / 15))) : 0,
    },
    {
      id: 'cashflow_positive',
      title: 'Arus Kas Positif (Positive Cashflow)',
      category: 'budget',
      desc: 'Pemasukan uang bulan ini melampaui total seluruh pengeluaran.',
      requirement: 'Total pemasukan > total pengeluaran',
      icon: '💰',
      unlocked: netSavings > 0,
      rewardBadge: 'Dompet Tebal',
      progressText: netSavings > 0
        ? `Surplus Rp ${netSavings.toLocaleString('id-ID')}`
        : `Defisit Rp ${Math.abs(netSavings).toLocaleString('id-ID')}`,
      progressPercent: totalIncome > 0 ? Math.min(100, Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))) : 0,
    },
    {
      id: 'super_saver',
      title: 'Master Penabung (Super Saver)',
      category: 'savings',
      desc: 'Menyisihkan minimal 20% dari total penghasilan untuk tabungan atau investasi.',
      requirement: 'Rasio tabungan bersih minimal 20%',
      icon: '🌟',
      unlocked: savingsRate >= 20,
      rewardBadge: 'Investor Masa Depan',
      progressText: `${savingsRate}% dari target 20%`,
      progressPercent: Math.min(100, Math.max(0, Math.round((savingsRate / 20) * 100))),
    },
    {
      id: 'disciplined_tracker',
      title: 'Pencatat Disiplin (Master Tracker)',
      category: 'discipline',
      desc: 'Rajin mendokumentasikan setiap rupiah dengan mencatat minimal 10 transaksi.',
      requirement: 'Mencatat minimal 10 transaksi di aplikasi',
      icon: '📝',
      unlocked: transactions.length >= 10,
      rewardBadge: 'Konsisten & Teliti',
      progressText: `${transactions.length} / 10 transaksi tercatat`,
      progressPercent: Math.min(100, Math.round((transactions.length / 10) * 100)),
    },
    {
      id: 'smart_shopper',
      title: 'Belanja Cerdas Cimahi (Smart Shopper)',
      category: 'smart',
      desc: 'Pacing anggaran terkendali dan pengeluaran hari ini masih dalam batas limit harian.',
      requirement: 'Pengeluaran hari ini tidak melampaui limit rekomendasi harian',
      icon: '🛒',
      unlocked: !dailyStatus.isOverBudget,
      rewardBadge: 'Pacing Terkendali',
      progressText: `Hari ini Rp ${dailyStatus.todayExpense.toLocaleString('id-ID')} / Rp ${Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}`,
      progressPercent: Math.min(100, Math.round((dailyStatus.todayExpense / (dailyStatus.dailyLimit || 1)) * 100)),
    },
    {
      id: 'month_end_evaluator',
      title: 'Evaluator Cekatan (Closing Master)',
      category: 'discipline',
      desc: 'Memantau dan merekap laporan pengeluaran di penghujung bulan tanpa menunda.',
      requirement: 'Membuka dan mengevaluasi laporan penutupan bulan',
      icon: '📊',
      unlocked: dailyStatus.remainingDays <= 5,
      rewardBadge: 'Finansial Matang',
      progressText: `Sisa ${dailyStatus.remainingDays} hari penutupan bulan`,
      progressPercent: Math.min(100, Math.round(((30 - dailyStatus.remainingDays) / 30) * 100)),
    },
    {
      id: 'local_wisdom_shopper',
      title: 'Jawara Belanja Lokal Cimahi',
      category: 'smart',
      desc: 'Mencatat transaksi bahan makanan atau kebutuhan harian dari pasar tradisional atau toko sekitar.',
      requirement: 'Mencatat belanja kategori Makanan & Minuman atau Belanja Harian',
      icon: '🥬',
      unlocked: transactions.some((t) => t.category.includes('Makanan') || t.category.includes('Belanja')),
      rewardBadge: 'Sahabat UMKM',
      progressText: transactions.some((t) => t.category.includes('Makanan') || t.category.includes('Belanja')) ? 'Sudah tercatat' : 'Belum tercatat',
      progressPercent: transactions.some((t) => t.category.includes('Makanan') || t.category.includes('Belanja')) ? 100 : 0,
    },
  ];

  const unlockedList = achievements.filter((a) => a.unlocked);
  const lockedList = achievements.filter((a) => !a.unlocked);
  const unlockedCount = unlockedList.length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const displayedList = achievements.filter((a) => {
    if (filter === 'unlocked' && !a.unlocked) return false;
    if (filter === 'locked' && a.unlocked) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-amber-500/20">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Pencapaian & Medali Finansial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Koleksi Prestasi Pengelolaan Anggaran
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Setiap rupiah yang Anda hemat dan catat membuka medali penghargaan finansial.
              </p>
            </div>

            {/* Score & Grade Display */}
            <div className="flex items-center space-x-3 bg-white/10 p-3 sm:p-4 rounded-2xl backdrop-blur-md border border-white/15 shrink-0">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  Skor Finansial
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white">{healthScore}/100</p>
                <p className="text-[10px] text-slate-300">{healthGradeLabel}</p>
              </div>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${healthGradeBadgeColor}`}
              >
                {healthGrade}
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center space-x-2 text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Total Medali Terbuka: <strong>{unlockedCount} dari {totalCount} Medali</strong></span>
              </span>
              <span className="text-amber-400 font-bold font-mono">{progressPercent}% Komplet</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
            <button
              onClick={onOpenRecapModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition active:scale-95 shadow-md shadow-amber-400/20 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Buka Pop-up Rekap Akhir Bulan (PNG/PDF)</span>
            </button>

            <button
              onClick={() => onNavigateTab('overview')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>Lihat Ringkasan Anggaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pujian atau Pesan Cinta dari Suami */}
      {isUnderBudget ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-amber-950/30 border border-rose-300/80 dark:border-rose-800/60 shadow-xs flex items-start space-x-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-rose-500/20">
            💌
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Pujian dari Suami
              </span>
              <span className="text-xs text-rose-500 font-semibold flex items-center space-x-1">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                <span>Tercinta</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              "Hebat Sekali Sayang, Target Anggaran Bulan Ini Tercapai!"
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "Terima kasih ya sayang sudah begitu telaten dan bijak mengatur belanja keluarga bulan ini. Sisa surplus tabungan Rp {budgetDifference.toLocaleString('id-ID')} ini bukti nyata dedikasi dan kedisiplinanmu. Aku bangga sekali sama kamu! 🥰"
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/30 border border-amber-300/80 dark:border-amber-800/60 shadow-xs flex items-start space-x-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/20">
            💌
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Pesan dari Suami
              </span>
              <span className="text-xs text-amber-600 font-semibold flex items-center space-x-1">
                <Heart className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Penuh Cinta & Dukungan</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              "Tetap Semangat Sayang, Kita Evaluasi dan Atur Bareng Lagi Ya!"
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "Tidak apa-apa sayang kalau bulan ini sedikit melampaui target pagu. Yang paling utama kamu sudah rajin mencatat semuanya secara rapi dan terbuka. Bulan depan kita siapkan strategi belanja bareng lagi ya! Semangat! 💪"
            </p>
          </div>
        </div>
      )}

      {/* Filter and Category Pills Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'unlocked'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Terbuka ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'locked'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Terkunci ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'budget', label: 'Pagu & Arus Kas' },
            { id: 'savings', label: 'Tabungan' },
            { id: 'discipline', label: 'Disiplin' },
            { id: 'smart', label: 'Belanja Pintar' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Achievement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedList.map((item) => (
          <div
            key={item.id}
            className={`relative rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between space-y-4 ${
              item.unlocked
                ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/60 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/20'
                : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
            }`}
          >
            {/* Top row: Icon, Title, and Badge */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 ${
                    item.unlocked
                      ? 'bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-400/50'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 grayscale'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                      item.unlocked
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.unlocked ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{item.rewardBadge}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Terkunci</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>

            {/* Requirement Box & Progress */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Target:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                  {item.requirement}
                </span>
              </div>

              {item.progressText && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Status:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {item.progressText}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.unlocked ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {displayedList.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak ada medali pada filter ini.
          </p>
          <p className="text-xs text-slate-500">
            Coba ganti filter atau pilih 'Semua' untuk melihat seluruh lencana.
          </p>
        </div>
      )}
    </div>
  );
};
