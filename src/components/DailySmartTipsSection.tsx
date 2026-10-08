import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Tag,
  AlertTriangle,
  Lightbulb,
  MapPin,
  RefreshCw,
  Loader2,
  ArrowRight,
  TrendingDown,
  Store,
} from 'lucide-react';
import { BudgetConfig, DailyLimitStatus, Transaction, DailySmartTip } from '../types/finance.ts';

interface DailySmartTipsSectionProps {
  config: BudgetConfig;
  dailyStatus: DailyLimitStatus;
  transactions: Transaction[];
  remainingBudget: number;
  onAskChatbotWithTip: (tipText: string) => void;
}

const STORAGE_KEY_DAILY_TIPS = 'catatcuan_daily_smart_tips_cache_v1';

export const DailySmartTipsSection: React.FC<DailySmartTipsSectionProps> = ({
  config,
  dailyStatus,
  transactions,
  remainingBudget,
  onAskChatbotWithTip,
}) => {
  const [tips, setTips] = useState<DailySmartTip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load tips from cache or fetch on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_DAILY_TIPS);
      if (cached) {
        const parsed = JSON.parse(cached);
        const todayStr = new Date().toISOString().split('T')[0];
        if (parsed.date === todayStr && parsed.tips && parsed.tips.length > 0) {
          setTips(parsed.tips);
          setLastUpdated(parsed.time || '');
          return;
        }
      }
    } catch {
      // ignore
    }

    // If no valid cache for today, fetch
    fetchTips();
  }, []);

  const fetchTips = async () => {
    setIsLoading(true);

    const categoriesBreakdown: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoriesBreakdown[t.category] = (categoriesBreakdown[t.category] || 0) + t.amount;
      });

    try {
      const res = await fetch('/api/gemini/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyBudget: config.monthlyBudget,
          totalIncome: 0,
          totalExpense: config.monthlyBudget - remainingBudget,
          remainingBudget,
          daysInMonth: dailyStatus.daysInMonth,
          currentDay: dailyStatus.currentDay,
          remainingDays: dailyStatus.remainingDays,
          dailyLimit: dailyStatus.dailyLimit,
          todayExpense: dailyStatus.todayExpense,
          categoriesBreakdown,
          recentTransactions: transactions.slice(0, 5),
          cityContext: config.cityContext,
        }),
      });

      const data = await res.json();
      if (data.success && data.tips && data.tips.length > 0) {
        setTips(data.tips);
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastUpdated(nowTime);

        // Cache for today
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(
          STORAGE_KEY_DAILY_TIPS,
          JSON.stringify({
            date: todayStr,
            time: nowTime,
            tips: data.tips,
          })
        );
      }
    } catch (e) {
      console.warn('Failed to fetch daily tips, using fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Pangan Hemat':
        return {
          icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />,
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'Promo Belanja':
        return {
          icon: <Tag className="w-3.5 h-3.5 text-blue-500" />,
          bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'Batas Harian':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          icon: <Lightbulb className="w-3.5 h-3.5 text-teal-500" />,
          bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Tips Cerdas Belanja Hari Ini (Gemini AI)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Cimahi & KBB (H. Ghofur, PakuHaji, Cilame, Ngamprah, Cipageran)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rekomendasi pangan hemat, diskon supermarket Borma & promo area Cimahi - KBB
              {lastUpdated && ` • Diperbarui ${lastUpdated}`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchTips}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          <span>{isLoading ? 'Menganalisis...' : 'Perbarui Tips'}</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && tips.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mengambil data promo Cimahi & Bandung Barat (Haji Ghofur, PakuHaji, Cilame, Ngamprah, Cipageran) dari Gemini AI...
          </p>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {tips.map((tip, idx) => {
            const badge = getCategoryBadge(tip.category);
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition flex flex-col justify-between space-y-3 group shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{tip.category}</span>
                    </span>

                    {tip.estimatedSavings && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        <span>Hemat {tip.estimatedSavings}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-snug">
                    {tip.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tip.actionableAdvice}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate max-w-[65%]">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tip.locationOrPlace}</span>
                  </span>

                  <button
                    onClick={() =>
                      onAskChatbotWithTip(
                        `Tolong jelaskan lebih lanjut mengenai tips "${tip.title}" untuk belanja di ${tip.locationOrPlace}. Bagaimana cara memanfaatkannya hari ini?`
                      )
                    }
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center space-x-0.5 shrink-0"
                  >
                    <span>Tanya AI</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
