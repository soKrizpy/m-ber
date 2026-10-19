import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  BarChart3,
  ShieldCheck,
  Award,
  Gift,
} from 'lucide-react';
import { RewardedAdsService } from '../services/rewardedAds.ts';

export type MainTabType = 'overview' | 'transactions' | 'analytics' | 'compliance';

interface BottomNavbarProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  transactionCount?: number;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  activeTab,
  onChangeTab,
  transactionCount = 0,
}) => {
  const [hasCompliancePass, setHasCompliancePass] = useState(() =>
    RewardedAdsService.hasActiveCompliancePass()
  );

  useEffect(() => {
    const checkPass = () => setHasCompliancePass(RewardedAdsService.hasActiveCompliancePass());
    checkPass();
    window.addEventListener('mber_rewards_updated', checkPass);
    return () => window.removeEventListener('mber_rewards_updated', checkPass);
  }, []);

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Ringkasan',
      shortLabel: 'Ringkasan',
      icon: Wallet,
      badge: null,
      isSpecial: false,
    },
    {
      id: 'transactions' as const,
      label: 'Transaksi',
      shortLabel: 'Transaksi',
      icon: Receipt,
      badge: transactionCount > 0 ? transactionCount : null,
      isSpecial: false,
    },
    {
      id: 'analytics' as const,
      label: 'Analitik & PDF',
      shortLabel: 'Laporan',
      icon: BarChart3,
      badge: null,
      isSpecial: false,
    },
    {
      id: 'compliance' as const,
      label: 'Rapor Belanja Bunda',
      shortLabel: 'Rapor Bunda',
      icon: Award,
      badge: hasCompliancePass ? 'Aktif' : 'Ad',
      isSpecial: true,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama M-Ber"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-all pb-[max(0.35rem,env(safe-area-inset-bottom))] md:static md:bottom-auto md:z-30 md:bg-white/90 md:dark:bg-slate-900/90 md:backdrop-blur-md md:border-t-0 md:border-b md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-xs md:sticky md:top-16 md:pb-0"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-around md:justify-center md:gap-3 lg:gap-4 py-1 sm:py-1.5 md:py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                role="tab"
                aria-selected={isActive}
                className={`relative group flex flex-col md:flex-row items-center justify-center transition-all duration-200 rounded-2xl md:rounded-xl focus:outline-hidden px-2 sm:px-3 py-1 sm:py-1.5 min-w-[62px] sm:min-w-[76px] md:min-w-0 md:px-4 md:py-2 md:gap-2 cursor-pointer ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 dark:border-emerald-500/30 shadow-xs font-bold'
                      : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 dark:border-emerald-500/30 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                {/* Active Indicator Top Pill on Mobile */}
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 md:hidden" />
                )}

                {/* Active Indicator Bottom Line on Desktop */}
                {isActive && (
                  <span className="hidden md:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 lg:w-10 h-0.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  />

                  {/* Badge */}
                  {item.badge !== null && (
                    <span
                      className={`absolute -top-1.5 -right-3 text-[9px] font-black rounded-full px-1.5 py-0.2 leading-tight ${
                        item.badge === 'Ad'
                          ? 'bg-amber-500 text-slate-950 ring-1 ring-white dark:ring-slate-900'
                          : item.badge === 'Aktif'
                          ? 'bg-emerald-500 text-white ring-1 ring-white dark:ring-slate-900'
                          : 'bg-emerald-600 text-white min-w-[14px] text-center'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] sm:text-xs font-bold tracking-tight mt-0.5 md:mt-0">
                  <span className="md:hidden">{item.shortLabel}</span>
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
