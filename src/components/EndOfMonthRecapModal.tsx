import React, { useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  Download,
  FileText,
  Copy,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { BudgetConfig, Transaction, DailyLimitStatus, CategorySummary } from '../types/finance';
import { ExportService } from '../services/pdfExport';

interface EndOfMonthRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
  onOpenAdvisor?: () => void;
  onOpenAchievements?: () => void;
  onUpdateConfig?: (newCfg: BudgetConfig) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const EndOfMonthRecapModal: React.FC<EndOfMonthRecapModalProps> = ({
  isOpen,
  onClose,
  config,
  transactions,
  dailyStatus,
  totalIncome,
  totalExpense,
  remainingBudget,
  categories,
  onOpenAchievements,
  onToast,
}) => {
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Formatting date and month display
  const monthDate = new Date(`${config.month || new Date().toISOString().slice(0, 7)}-01T00:00:00`);
  const monthName = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Calculate Metrics
  const budgetUsagePercent = config.monthlyBudget > 0
    ? Math.round((totalExpense / config.monthlyBudget) * 100)
    : 0;
  const isUnderBudget = totalExpense <= config.monthlyBudget;
  const budgetDifference = config.monthlyBudget - totalExpense;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

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
  let gradeBadgeColor = 'bg-blue-500 text-white';
  let healthGradeLabel = 'Cukup Baik';

  if (healthScore >= 90) {
    healthGrade = 'A+';
    gradeBadgeColor = 'bg-emerald-500 text-white shadow-emerald-500/30';
    healthGradeLabel = 'Sangat Sehat!';
  } else if (healthScore >= 80) {
    healthGrade = 'A';
    gradeBadgeColor = 'bg-teal-500 text-white shadow-teal-500/30';
    healthGradeLabel = 'Sehat & Hemat';
  } else if (healthScore >= 70) {
    healthGrade = 'B';
    gradeBadgeColor = 'bg-blue-500 text-white shadow-blue-500/30';
    healthGradeLabel = 'Cukup Stabil';
  } else {
    healthGrade = 'C';
    gradeBadgeColor = 'bg-rose-500 text-white shadow-rose-500/30';
    healthGradeLabel = 'Perlu Evaluasi';
  }

  // Quick achievements count
  let unlockedCount = 0;
  if (isUnderBudget) unlockedCount++;
  if (budgetDifference >= config.monthlyBudget * 0.15 && isUnderBudget) unlockedCount++;
  if (netSavings > 0) unlockedCount++;
  if (transactions.length >= 10) unlockedCount++;
  if (!dailyStatus.isOverBudget) unlockedCount++;
  if (savingsRate >= 20) unlockedCount++;

  // Handle Export PNG
  const handleDownloadPNG = async () => {
    try {
      setIsExportingPNG(true);
      await ExportService.exportPNG(
        'monthly-recap-infographic-card',
        `M-Ber_Laporan_Akhir_Bulan_${config.month}.png`
      );
      onToast('Infografis laporan bulanan berhasil diunduh sebagai gambar PNG!', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Gagal mengunduh gambar PNG', 'warning');
    } finally {
      setIsExportingPNG(false);
    }
  };

  // Handle Export PDF
  const handleDownloadPDF = () => {
    try {
      setIsExportingPDF(true);
      ExportService.exportPDF({
        config,
        transactions,
        dailyStatus,
        totalIncome,
        totalExpense,
        remainingBudget,
        categories,
      });
      onToast('Laporan PDF resmi M-Ber berhasil diunduh!', 'success');
    } catch (err: any) {
      console.error(err);
      onToast('Gagal mencetak dokumen PDF', 'warning');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Copy text recap to clipboard
  const handleCopyText = () => {
    const text = `📊 *REKAP LAPORAN PENGELUARAN BULANAN M-BER*
Periode: ${monthName}
Wilayah: ${config.cityContext}
----------------------------------------
🏆 Skor Keuangan: ${healthScore}/100 (Grade ${healthGrade} - ${healthGradeLabel})
💰 Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
💸 Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
🎯 Target Pagu Anggaran: Rp ${config.monthlyBudget.toLocaleString('id-ID')}
✨ Status Anggaran: ${isUnderBudget ? `Hemat Rp ${budgetDifference.toLocaleString('id-ID')} (${budgetUsagePercent}% terpakai)` : `Over Budget Rp ${Math.abs(budgetDifference).toLocaleString('id-ID')} (${budgetUsagePercent}% terpakai)`}
📈 Arus Kas Bersih: Rp ${netSavings.toLocaleString('id-ID')} (${savingsRate}% rasio tabungan)

_Dibuat otomatis oleh M-Ber (Monthly Budget Report)_`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      onToast('Ringkasan teks berhasil disalin! Siap dibagikan ke WhatsApp.', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup Pengingat"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 pr-8">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
                  Pengingat Akhir Bulan
                </span>
                <span className="text-xs text-emerald-200">Sisa {dailyStatus.remainingDays} hari</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Rekap & Evaluasi Anggaran {monthName}
              </h2>
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5 touch-pan-y scrollbar-thin"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* 1. Highlight Praise or Motivation Box */}
          {isUnderBudget ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/15 border border-emerald-400 dark:border-emerald-600/50 space-y-2">
              <div className="flex items-center space-x-2.5 text-emerald-700 dark:text-emerald-400">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Pujian dari Suami: Target Anggaran Tercapai! 🎉
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-300">
                    Pengeluaran terkendali dengan sangat disiplin bulan ini.
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <strong>Hebat sekali sayang!</strong> Kamu berhasil menjaga pengeluaran di angka{' '}
                <strong>Rp {totalExpense.toLocaleString('id-ID')}</strong> dari target pagu{' '}
                <strong>Rp {config.monthlyBudget.toLocaleString('id-ID')}</strong> ({budgetUsagePercent}% terpakai).
                Tersisa surplus tabungan keluarga sebesar{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  Rp {budgetDifference.toLocaleString('id-ID')}
                </strong>{' '}
                yang siap disimpan untuk memperkuat dana tabungan masa depan.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-400 dark:border-amber-600/50 space-y-2">
              <div className="flex items-center space-x-2.5 text-amber-800 dark:text-amber-300">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Pesan Semangat dari Suami: Evaluasi Bareng & Bangkit Lagi! 💪
                  </h3>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Setiap catatan adalah bahan refleksi menuju kebebasan finansial keluarga.
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                Bulan ini belanja keluarga melampaui batas anggaran sebesar{' '}
                <strong>Rp {Math.abs(budgetDifference).toLocaleString('id-ID')}</strong>. Jangan berkecil hati sayang, yang terpenting kamu sudah konsisten mencatat secara jujur. Bulan depan kita evaluasi pos belanja bersama dan susun target baru yang lebih hemat!
              </p>
            </div>
          )}

          {/* 2. 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                <Target className="w-3 h-3 text-indigo-500" />
                <span>Pagu Target</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Rp {config.monthlyBudget.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400">Target awal</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                <TrendingDown className="w-3 h-3 text-rose-500" />
                <span>Total Belanja</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                Rp {totalExpense.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400">{budgetUsagePercent}% terpakai</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                <Wallet className="w-3 h-3 text-emerald-500" />
                <span>Sisa Saldo</span>
              </div>
              <p className={`text-sm sm:text-base font-bold ${isUnderBudget ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isUnderBudget ? '+' : '-'} Rp {Math.abs(budgetDifference).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400">{isUnderBudget ? 'Hemat' : 'Defisit'}</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                <Award className="w-3 h-3 text-amber-500" />
                <span>Skor Keuangan</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-amber-500">
                {healthScore} ({healthGrade})
              </p>
              <p className="text-[10px] text-slate-400">{healthGradeLabel}</p>
            </div>
          </div>

          {/* 3. Link to Full Achievements Page */}
          {onOpenAchievements && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  🏆
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {unlockedCount} Medali Prestasi Terbuka
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Lihat detail lencana dan syarat pencapaian di halaman khusus Prestasi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAchievements();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
              >
                <span>Buka Prestasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 4. Action Banner to Export Report */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center space-x-1.5">
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Generate Laporan Siap Cetak & Simpan</span>
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Pilih format gambar PNG untuk status sosmed/keluarga, atau PDF lengkap.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={isExportingPNG}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPNG ? 'Memproses...' : 'Unduh PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>{isExportingPDF ? 'Mencetak...' : 'Cetak PDF'}</span>
              </button>
            </div>
          </div>

          {/* HIDDEN / OFF-SCREEN INFOGRAPHIC CONTAINER FOR HIGH-RES PNG CAPTURE */}
          <div className="overflow-hidden h-0 opacity-0 pointer-events-none">
            <div
              id="monthly-recap-infographic-card"
              className="w-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-8 rounded-3xl border border-teal-500/30 space-y-6"
            >
              {/* Card Brand Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black">
                    <Wallet className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black tracking-tight text-white">M-Ber</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Monthly Report
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-200">
                      {monthName} • {config.cityContext}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-xl bg-white/10 text-center border border-white/15">
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">Skor</p>
                    <p className="text-xl font-black text-amber-400">{healthScore} ({healthGrade})</p>
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Total Pengeluaran</p>
                  <p className="text-lg font-black text-rose-400">
                    Rp {totalExpense.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-300">{budgetUsagePercent}% dari pagu</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Total Pemasukan</p>
                  <p className="text-lg font-black text-emerald-400">
                    Rp {totalIncome.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-300">Net: Rp {netSavings.toLocaleString('id-ID')}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Pagu Anggaran</p>
                  <p className="text-lg font-black text-white">
                    Rp {config.monthlyBudget.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-300">Batas bulanan</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Surplus / Sisa</p>
                  <p className={`text-lg font-black ${isUnderBudget ? 'text-teal-300' : 'text-amber-400'}`}>
                    Rp {Math.abs(budgetDifference).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-300">{isUnderBudget ? 'Hemat aman' : 'Over budget'}</p>
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <p className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
                    Distribusi Pos Terbesar
                  </p>
                  <div className="space-y-1.5">
                    {categories.slice(0, 3).map((cat, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">{cat.category}</span>
                          <span className="font-bold text-white font-mono">
                            Rp {cat.amount.toLocaleString('id-ID')} ({cat.percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/10">
                <span>Generated by M-Ber (Monthly Budget Report)</span>
                <span>{new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
            title="Salin ringkasan teks untuk WhatsApp"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isCopied ? 'Tersalin ✓' : 'Salin WhatsApp'}</span>
            <span className="sm:hidden">{isCopied ? 'Tersalin' : 'Salin'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExportingPNG}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PNG</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
