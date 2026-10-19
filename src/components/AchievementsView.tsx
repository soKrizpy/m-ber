import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Heart,
  CheckCircle2,
  Lock,
  Wallet,
  TrendingUp,
  Target,
  FileDown,
  Gift,
  Clock,
  Info,
  Smile,
} from 'lucide-react';
import {
  BudgetConfig,
  Transaction,
  DailyLimitStatus,
  CategorySummary,
} from '../types/finance.ts';
import { RewardedAdsService } from '../services/rewardedAds.ts';
import { RewardedAdModal } from './RewardedAdModal.tsx';

interface AchievementsViewProps {
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
  onOpenRecapModal: () => void;
  onNavigateTab: (tab: 'overview' | 'transactions' | 'analytics' | 'compliance') => void;
  onToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
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
  onToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [hasCompliancePass, setHasCompliancePass] = useState(() =>
    RewardedAdsService.hasActiveCompliancePass()
  );
  const [remainingTime, setRemainingTime] = useState(() =>
    RewardedAdsService.getCompliancePassRemainingTime()
  );

  useEffect(() => {
    const updatePassStatus = () => {
      setHasCompliancePass(RewardedAdsService.hasActiveCompliancePass());
      setRemainingTime(RewardedAdsService.getCompliancePassRemainingTime());
    };

    updatePassStatus();
    const interval = setInterval(updatePassStatus, 30000);
    window.addEventListener('mber_rewards_updated', updatePassStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mber_rewards_updated', updatePassStatus);
    };
  }, []);

  const isUnderBudget = totalExpense <= config.monthlyBudget;
  const budgetDifference = config.monthlyBudget - totalExpense;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsagePercent =
    config.monthlyBudget > 0 ? Math.round((totalExpense / config.monthlyBudget) * 100) : 0;

  // Skor Ibu Bijak (0 - 100)
  let healthScore = 70;
  if (isUnderBudget) healthScore += 15;
  if (savingsRate >= 20) healthScore += 10;
  else if (savingsRate >= 10) healthScore += 5;
  else if (savingsRate < 0) healthScore -= 20;

  if (transactions.length >= 10) healthScore += 5;
  if (budgetUsagePercent > 100) healthScore -= Math.min(30, (budgetUsagePercent - 100) * 1.5);
  healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

  let healthGrade = 'B';
  let healthGradeLabel = 'Cukup Stabil & Aman Terkendali';
  let healthGradeBadgeColor = 'bg-blue-500 text-white';

  if (healthScore >= 90) {
    healthGrade = 'A+';
    healthGradeLabel = 'Bunda Hebat! Belanja Rapi & Nggak Boncos';
    healthGradeBadgeColor = 'bg-emerald-500 text-white shadow-emerald-500/30';
  } else if (healthScore >= 80) {
    healthGrade = 'A';
    healthGradeLabel = 'Bunda Hemat & Cermat Atur Uang Dapur';
    healthGradeBadgeColor = 'bg-teal-500 text-white shadow-teal-500/30';
  } else if (healthScore >= 70) {
    healthGrade = 'B';
    healthGradeLabel = 'Cukup Stabil & Masih Aman';
    healthGradeBadgeColor = 'bg-blue-500 text-white shadow-blue-500/30';
  } else {
    healthGrade = 'C';
    healthGradeLabel = 'Yuk Ditata Lagi Biar Nggak Boncos';
    healthGradeBadgeColor = 'bg-rose-500 text-white shadow-rose-500/30';
  }

  // 8 Medali & Prestasi Belanja Bunda yang Hangat & Akrab
  const achievements: AchievementItem[] = [
    {
      id: 'budget_champion',
      title: 'Juara Jaga Uang Dapur (Nggak Boncos)',
      category: 'budget',
      desc: 'Pintar menjaga pengeluaran sebulan tidak melewati batas jatah uang belanja yang disiapkan.',
      requirement: `Belanja tidak lebih dari Rp ${config.monthlyBudget.toLocaleString('id-ID')}`,
      icon: '🏆',
      unlocked: isUnderBudget && config.monthlyBudget > 0,
      rewardBadge: 'Juara Hemat',
      progressText: `${budgetUsagePercent}% terpakai dari 100%`,
      progressPercent: Math.min(100, budgetUsagePercent),
    },
    {
      id: 'surplus_guardian',
      title: 'Ratu Nabung (Ada Sisa Simpanan)',
      category: 'savings',
      desc: 'Hebat bisa menyisakan uang belanja di atas 15% untuk simpanan darurat keluarga.',
      requirement: 'Sisa saldo di atas 15% dari target bulanan',
      icon: '🛡️',
      unlocked: budgetDifference >= config.monthlyBudget * 0.15 && isUnderBudget,
      rewardBadge: 'Simpanan Aman',
      progressText:
        budgetDifference > 0
          ? `Tersisa Rp ${budgetDifference.toLocaleString('id-ID')}`
          : 'Belum ada sisa',
      progressPercent: isUnderBudget
        ? Math.min(100, Math.round((budgetDifference / (config.monthlyBudget || 1)) * 100 * (100 / 15)))
        : 0,
    },
    {
      id: 'cashflow_positive',
      title: 'Dompet Lega & Berkah',
      category: 'budget',
      desc: 'Pemasukan uang bulan ini selalu lebih besar daripada seluruh belanjaan keluar.',
      requirement: 'Total pemasukan > total pengeluaran',
      icon: '💰',
      unlocked: netSavings > 0,
      rewardBadge: 'Dompet Tebal',
      progressText:
        netSavings > 0
          ? `Surplus Rp ${netSavings.toLocaleString('id-ID')}`
          : `Defisit Rp ${Math.abs(netSavings).toLocaleString('id-ID')}`,
      progressPercent:
        totalIncome > 0
          ? Math.min(100, Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)))
          : 0,
    },
    {
      id: 'super_saver',
      title: 'Bunda Visioner (Rutin Sisihkan Uang)',
      category: 'savings',
      desc: 'Bisa menyisihkan minimal 20% dari penghasilan untuk masa depan anak & tabungan impian.',
      requirement: 'Rasio tabungan bersih minimal 20%',
      icon: '🌟',
      unlocked: savingsRate >= 20,
      rewardBadge: 'Masa Depan Cerah',
      progressText: `${savingsRate}% dari target 20%`,
      progressPercent: Math.min(100, Math.max(0, Math.round((savingsRate / 20) * 100))),
    },
    {
      id: 'disciplined_tracker',
      title: 'Bunda Teliti (Rajin Catat Pengeluaran)',
      category: 'discipline',
      desc: 'Rajin mendokumentasikan setiap rupiah yang keluar tanpa ada yang kelupaan (minimal 10 transaksi).',
      requirement: 'Mencatat minimal 10 transaksi belanja',
      icon: '📝',
      unlocked: transactions.length >= 10,
      rewardBadge: 'Ibu Rapi & Rajin',
      progressText: `${transactions.length} / 10 transaksi tercatat`,
      progressPercent: Math.min(100, Math.round((transactions.length / 10) * 100)),
    },
    {
      id: 'smart_shopper',
      title: 'Jago Ngerem Belanja Harian',
      category: 'smart',
      desc: 'Belanjaan hari ini terkontrol dan tidak melampaui rekomendasi batas jatah harian.',
      requirement: 'Pengeluaran hari ini <= rekomendasi harian',
      icon: '🛒',
      unlocked: !dailyStatus.isOverBudget,
      rewardBadge: 'Ritme Terjaga',
      progressText: `Hari ini Rp ${dailyStatus.todayExpense.toLocaleString('id-ID')} / Rp ${Math.round(
        dailyStatus.dailyLimit
      ).toLocaleString('id-ID')}`,
      progressPercent: Math.min(
        100,
        Math.round((dailyStatus.todayExpense / (dailyStatus.dailyLimit || 1)) * 100)
      ),
    },
    {
      id: 'month_end_evaluator',
      title: 'Rapi Tutup Buku Akhir Bulan',
      category: 'discipline',
      desc: 'Melihat rekap pengeluaran saat tanggal tua agar siap menyambut awal bulan dengan tenang.',
      requirement: 'Membuka laporan penutupan bulan',
      icon: '📊',
      unlocked: dailyStatus.remainingDays <= 5,
      rewardBadge: 'Keuangan Tertata',
      progressText: `Sisa ${dailyStatus.remainingDays} hari penutupan bulan`,
      progressPercent: Math.min(100, Math.round(((30 - dailyStatus.remainingDays) / 30) * 100)),
    },
    {
      id: 'local_wisdom_shopper',
      title: 'Bunda Cermat Pasar Tradisional',
      category: 'smart',
      desc: 'Pintar memilih kebutuhan dapur dan belanja sembako segar hemat di pasar sekitar.',
      requirement: 'Mencatat belanja kategori Makanan atau Belanja Harian',
      icon: '🥬',
      unlocked: transactions.some(
        (t) => t.category.includes('Makanan') || t.category.includes('Belanja')
      ),
      rewardBadge: 'Sahabat Pasar',
      progressText: transactions.some(
        (t) => t.category.includes('Makanan') || t.category.includes('Belanja')
      )
        ? 'Sudah tercatat'
        : 'Belum tercatat',
      progressPercent: transactions.some(
        (t) => t.category.includes('Makanan') || t.category.includes('Belanja')
      )
        ? 100
        : 0,
    },
  ];

  const unlockedList = achievements.filter((a) => a.unlocked);
  const unlockedCount = unlockedList.length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const displayedList = achievements.filter((a) => {
    if (filter === 'unlocked' && !a.unlocked) return false;
    if (filter === 'locked' && a.unlocked) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    return true;
  });

  const handleRewardGranted = () => {
    setHasCompliancePass(true);
    setRemainingTime(RewardedAdsService.getCompliancePassRemainingTime());
    if (onToast) {
      onToast('🎉 Alhamdulillah! Akses 24 Jam Rapor Belanja Bunda berhasil dibuka.', 'success');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Hero Header Card - Hangat & Ramah untuk Ibu-Ibu */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-4 sm:p-7 shadow-xl border border-emerald-500/20">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-400/30">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Rapor Belanja Bunda</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Skor Ibu Bijak & Prestasi Belanja
              </h1>
              <p className="text-xs text-slate-300">
                Apresiasi untuk Bunda yang telaten menjaga uang dapur keluarga tetap aman dan berkah.
              </p>
            </div>

            {/* Score & Grade Display */}
            <div className="flex items-center justify-between sm:justify-start space-x-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/15 shrink-0">
              <div className="text-left sm:text-center">
                <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  Skor Ibu Bijak
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white">{healthScore}/100</p>
                <p className="text-[10px] text-slate-300">{healthGradeLabel}</p>
              </div>
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg ${healthGradeBadgeColor}`}
              >
                {healthGrade}
              </div>
            </div>
          </div>

          {/* Rewarded Ads Status Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 text-xs">
              {hasCompliancePass ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-semibold">
                    Rapor Bunda Lengkap Aktif: <strong>Sisa {remainingTime}</strong>
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-200">
                    Tonton video singkat 5 detik untuk membuka semua 8 medali hemat 24 jam gratis!
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setIsAdModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition active:scale-95 shadow-xs cursor-pointer shrink-0"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{hasCompliancePass ? 'Perpanjang 24 Jam (Video Singkat)' : 'Buka 24 Jam Gratis (Video Singkat)'}</span>
            </button>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200 text-[11px] sm:text-xs">
                Medali Terkumpul: <strong>{unlockedCount} dari {totalCount} Medali</strong>
              </span>
              <span className="text-emerald-400 font-bold font-mono text-xs">{progressPercent}% Komplet</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pesan Semangat untuk Bunda */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-950/60 flex items-start space-x-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg shrink-0">
          {isUnderBudget ? '🥰' : '💪'}
        </div>
        <div className="space-y-0.5 text-xs">
          <p className="font-bold text-slate-900 dark:text-white">
            {isUnderBudget
              ? 'Hebat Sekali, Bunda! Belanja Bulan Ini Nggak Boncos!'
              : 'Semangat Terus Bunda, Pelan-Pelan Kita Seimbangkan Ya!'}
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {isUnderBudget
              ? `Pengeluaran keluarga bulan ini sangat terjaga. Masih ada sisa simpanan Rp ${budgetDifference.toLocaleString('id-ID')} yang bisa dialokasikan untuk tabungan masa depan.`
              : `Pengeluaran bulan ini sedikit melewati perkiraan. Tenang ya Bunda, Bunda bisa cek limit harian di Ringkasan agar belanja hari-hari berikutnya kembali seimbang.`}
          </p>
        </div>
      </div>

      {/* Filter and Category Pills Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
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
            Sudah Diraih ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'locked'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bisa Dikejar ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'budget', label: 'Uang Dapur' },
            { id: 'savings', label: 'Tabungan' },
            { id: 'discipline', label: 'Catatan Rajin' },
            { id: 'smart', label: 'Belanja Cerdas' },
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

      {/* Grid of Mother Achievements */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedList.map((item, idx) => {
            const isGated = !hasCompliancePass && idx >= 2;

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl sm:rounded-3xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between space-y-3 ${
                  isGated
                    ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 backdrop-blur-xs select-none'
                    : item.unlocked
                    ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/60 shadow-sm shadow-amber-500/5 ring-1 ring-amber-400/20'
                    : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80'
                }`}
              >
                {/* Top row: Icon, Title, and Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                        isGated
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          : item.unlocked
                          ? 'bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-400/40'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 grayscale'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isGated
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : item.unlocked
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isGated ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>Buka via Video</span>
                          </>
                        ) : item.unlocked ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{item.rewardBadge}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Belum Diraih</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isGated
                        ? 'Tips & medali belanja bunda ini dapat dibuka gratis dengan menonton video singkat 5 detik.'
                        : item.desc}
                    </p>
                  </div>
                </div>

                {/* Requirement Box & Progress */}
                <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Target:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right truncate max-w-[170px]">
                      {item.requirement}
                    </span>
                  </div>

                  {!isGated && item.progressText && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Pencapaian:</span>
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

                  {isGated && (
                    <button
                      onClick={() => setIsAdModalOpen(true)}
                      className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[10px] transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Gift className="w-3 h-3" />
                      <span>Buka Medali Ini (Video 5s)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {displayedList.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Info className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Belum ada medali pada kategori ini.
          </p>
        </div>
      )}

      {/* Rewarded Ad Interactive Modal */}
      <RewardedAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        rewardType="compliance_pass"
        onRewardGranted={handleRewardGranted}
      />
    </div>
  );
};
