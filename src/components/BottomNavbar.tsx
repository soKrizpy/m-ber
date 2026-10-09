import React from 'react';
import {
  Wallet,
  Receipt,
  BarChart3,
  Award,
  Sparkles,
} from 'lucide-react';

interface BottomNavbarProps {
  activeTab: 'overview' | 'transactions' | 'analytics' | 'achievements' | 'gemini';
  onChangeTab: (tab: 'overview' | 'transactions' | 'analytics' | 'achievements' | 'gemini') => void;
  transactionCount?: number;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  activeTab,
  onChangeTab,
  transactionCount = 0,
}) => {
  const navItems = [
    {
      id: 'overview' as const,
      label: 'Ringkasan',
      shortLabel: 'Ringkasan',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'transactions' as const,
      label: 'Catatan Transaksi',
      shortLabel: 'Transaksi',
      icon: Receipt,
      badge: transactionCount > 0 ? transactionCount : null,
    },
    {
      id: 'analytics' as const,
      label: 'Analitik & PDF',
      shortLabel: 'Analitik',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'achievements' as const,
      label: 'Prestasi',
      shortLabel: 'Prestasi',
      icon: Award,
      badge: null,
    },
    {
      id: 'gemini' as const,
      label: 'Kang Tambal',
      shortLabel: 'Kang Tambal',
      icon: Sparkles,
      badge: 'AI',
      isAi: true,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-all md:static md:bottom-auto md:z-30 md:bg-white/90 md:dark:bg-slate-900/90 md:backdrop-blur-md md:border-t-0 md:border-b md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-xs md:sticky md:top-16"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-around md:justify-center md:gap-3 lg:gap-4 py-1.5 md:py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                role="tab"
                aria-selected={isActive}
                className={`relative group flex flex-col md:flex-row items-center justify-center transition-all duration-200 rounded-2xl md:rounded-xl focus:outline-hidden ${
                  // Responsive sizing and padding
                  'px-1.5 sm:px-3 py-1.5 min-w-[56px] sm:min-w-[68px] md:min-w-0 md:px-4 md:py-2 md:gap-2'
                } ${
                  isActive
                    ? item.isAi
                      ? 'bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs font-bold'
                      : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 dark:border-emerald-500/30 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                {/* Active Indicator Top Pill on Mobile */}
                {isActive && (
                  <span
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full md:hidden ${
                      item.isAi
                        ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                        : 'bg-emerald-500 dark:bg-emerald-400'
                    }`}
                  />
                )}

                {/* Active Indicator Bottom Line on Desktop */}
                {isActive && (
                  <span
                    className={`hidden md:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 lg:w-10 h-0.5 rounded-full ${
                      item.isAi
                        ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                        : 'bg-emerald-500 dark:bg-emerald-400'
                    }`}
                  />
                )}

                {/* Icon Container with Badge */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? item.isAi
                          ? 'text-teal-600 dark:text-teal-300 animate-pulse'
                          : 'text-emerald-600 dark:text-emerald-400'
                        : item.isAi
                        ? 'text-teal-600/80 dark:text-teal-400/80'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />

                  {/* Badge Counter / Tag */}
                  {item.badge !== null && (
                    <span
                      className={`absolute -top-1.5 -right-3 md:-top-1.5 md:-right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold leading-tight tracking-tight shadow-2xs ${
                        item.isAi
                          ? 'bg-gradient-to-r from-amber-400 to-teal-400 text-slate-950'
                          : 'bg-emerald-600 text-white dark:bg-emerald-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Tab Label */}
                <span className="text-[10px] md:text-xs tracking-tight whitespace-nowrap mt-0.5 md:mt-0 font-semibold">
                  <span className="inline md:hidden">{item.shortLabel}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
