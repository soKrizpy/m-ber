import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Tag,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  Transaction,
  BudgetConfig,
  DailyLimitStatus,
  CategorySummary,
} from '../types/finance.ts';
import { MarkdownView } from './MarkdownView.tsx';

interface GeminiAdvisorViewProps {
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
}

const QUICK_PROMPTS = [
  {
    icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
    title: 'Substitusi Pangan Lokal',
    desc: 'Pengganti bahan pokok di Pasar Atas / Jl. H. Ghofur & PakuHaji',
    prompt:
      'Berikan rekomendasi substitusi bahan makanan pokok yang mahal dengan alternatif bergizi yang murah di pasar tradisional Cimahi (Pasar Atas Baru) atau pedagang lokal sepanjang jalur Jl. Haji Ghofur & PakuHaji.',
  },
  {
    icon: <Tag className="w-4 h-4 text-blue-500" />,
    title: 'Promo Supermarket Cimahi & KBB',
    desc: 'Diskon JSM Borma, Super Indo, & minimarket Cilame - Cipageran',
    prompt:
      'Bagaimana trik belanja hemat memanfaatkan diskon promo supermarket di area Cimahi & KBB (Borma Gandawijaya/Kerkof, Super Indo Sangkuriang, minimarket di Desa Cilame Ngamprah, Haji Ghofur, dan Cipageran)? Kapan waktu promo terbaik dan apa saja yang paling murah?',
  },
  {
    icon: <CheckCircle className="w-4 h-4 text-teal-500" />,
    title: 'Strategi Cukup 30 Hari',
    desc: 'Pacing anggaran agar tidak tekor di akhir bulan',
    prompt:
      'Fokus utama: Bagaimana mengatur sisa uang saya agar cukup untuk 30 hari penuh? Berikan batas ketat pengeluaran harian dan pos mana saja yang harus diprioritaskan.',
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
    title: 'Solusi Tambah Pemasukan',
    desc: 'Ide penghasilan tambahan realistis di Cimahi - Ngamprah KBB',
    prompt:
      'Jika sisa uang bulanan sudah sangat minim dan kebutuhan pokok tidak bisa dipotong lagi, berikan ide nyata untuk menambah pemasukan bulanan bagi warga koridor Cimahi, Ngamprah, dan Kabupaten Bandung Barat.',
  },
];

export const GeminiAdvisorView: React.FC<GeminiAdvisorViewProps> = ({
  config,
  transactions,
  dailyStatus,
  totalIncome,
  totalExpense,
  remainingBudget,
  categories,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adviceResult, setAdviceResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConsult = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : userPrompt;
    setIsLoading(true);
    setErrorMsg(null);

    const categoriesBreakdown: Record<string, number> = {};
    categories.forEach((c) => {
      categoriesBreakdown[c.category] = c.amount;
    });

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthlyBudget: config.monthlyBudget,
          totalIncome,
          totalExpense,
          remainingBudget,
          daysInMonth: dailyStatus.daysInMonth,
          currentDay: dailyStatus.currentDay,
          remainingDays: dailyStatus.remainingDays,
          dailyLimit: dailyStatus.dailyLimit,
          todayExpense: dailyStatus.todayExpense,
          categoriesBreakdown,
          recentTransactions: transactions.slice(0, 8).map((t) => ({
            date: t.date,
            category: t.category,
            type: t.type,
            amount: t.amount,
            description: t.description,
          })),
          userPrompt: textToSend,
          cityContext: config.cityContext,
        }),
      });

      const data = await response.json();
      if (data.success && data.advice) {
        setAdviceResult(data.advice);
      } else {
        throw new Error(data.error || 'Gagal memuat rekomendasi anggaran.');
      }
    } catch (err: any) {
      console.error('Error fetching advice:', err);
      setErrorMsg(
        err.message ||
          'Terjadi kendala saat menghubungkan ke Kang Tambal. Pastikan koneksi server aktif.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!adviceResult) return;
    navigator.clipboard.writeText(adviceResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* AI Persona Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">
                    Kang Tambal
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Cimahi & KBB (H. Ghofur, Cilame, Ngamprah, Cipageran)
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Konsultan Keuangan Cerdas: Strategi 30 Hari, Belanja Hemat Pasar & Supermarket Cimahi - Bandung Barat
                </p>
              </div>
            </div>

            {/* Live Financial Metric Pills */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white">
                Sisa: <strong>Rp {remainingBudget.toLocaleString('id-ID')}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white">
                Limit/Hari: <strong>Rp {Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}</strong>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Kang Tambal menganalisis pengeluaran Anda secara personal dengan memahami biaya hidup nyata di Kota Cimahi & Kabupaten Bandung Barat (Pasar Atas Baru, Jl. Haji Ghofur, PakuHaji, Desa Cilame, Kec. Ngamprah, Cipageran, Borma, & Super Indo). AI memberikan substitusi pangan lokal, info promo mingguan, dan strategi budgeting 30 hari.
          </p>
        </div>
      </div>

      {/* Quick Prompt Cards */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Pilih Topik Konsultasi Cepat:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUserPrompt(qp.prompt);
                handleConsult(qp.prompt);
              }}
              disabled={isLoading}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition shadow-xs hover:shadow-md group space-y-2 disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition">
                {qp.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  {qp.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {qp.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Atau Tanyakan Hal Lain ke Kang Tambal:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleConsult();
              }
            }}
            placeholder="Contoh: Belanja di Pasar Antri vs Borma lebih hemat mana untuk beli ayam dan sayur?"
            className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
          <button
            onClick={() => handleConsult()}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 disabled:opacity-50 shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </div>
      </div>

      {/* Error Message if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AI Advice Output Display */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kang Tambal sedang menganalisis data keuangan Anda...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Menghitung ritme 30 hari, meneliti harga pangan lokal Pasar Antri & Pasar Atas, serta menyusun trik hemat terbaik.
            </p>
          </div>
        </div>
      ) : adviceResult ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rekomendasi Anggaran & Tips Cerdas Cimahi
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
              <button
                onClick={() => handleConsult()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Perbarui Saran"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Formatted Markdown Box */}
          <MarkdownView content={adviceResult} />
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Konsultasikan Anggaran Anda Sekarang
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Klik salah satu topik rekomendasi di atas atau tanyakan langsung apa saja mengenai strategi hemat belanja dan pengelolaan uang 30 hari di Cimahi.
          </p>
          <button
            onClick={() => handleConsult(QUICK_PROMPTS[2].prompt)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mulai Analisis 30 Hari</span>
          </button>
        </div>
      )}
    </div>
  );
};
