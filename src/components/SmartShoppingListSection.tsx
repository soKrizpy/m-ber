import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Circle,
  RefreshCw,
  Share2,
  Copy,
  PlusCircle,
  Store,
  ShieldCheck,
  TrendingDown,
  Info,
  SlidersHorizontal,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
} from 'lucide-react';
import {
  SmartShoppingPlan,
  SmartShoppingItem,
  ShoppingCategory,
  BudgetConfig,
  DailyLimitStatus,
  Transaction,
} from '../types/finance.ts';

interface SmartShoppingListSectionProps {
  config: BudgetConfig;
  dailyStatus: DailyLimitStatus;
  transactions: Transaction[];
  remainingBudget: number;
  onOpenAddTransaction?: (prefill: {
    amount: number;
    description: string;
    category: string;
    type: 'expense';
  }) => void;
  onToast: (message: string, type: 'success' | 'warning' | 'info') => void;
}

const STORAGE_KEY_SHOPPING_PLAN = 'mber_smart_shopping_plan_v1';
const STORAGE_KEY_CHECKED_ITEMS = 'mber_smart_shopping_checked_v1';

function createLocalFallbackPlan(remainingBudget: number, preference = 'balanced'): SmartShoppingPlan {
  const targetWeekly = remainingBudget > 0 ? Math.round(remainingBudget / 4) : 250000;
  
  const items: SmartShoppingItem[] = [
    {
      id: 'shop_1',
      name: 'Telur Ayam Negeri Segar',
      quantity: '1 kg (isi ~16 butir)',
      estimatedPrice: 28000,
      category: 'Protein & Lauk',
      recommendedPlace: 'Pasar Atas Baru Cimahi / Warung Sembako Jl. Haji Ghofur',
      antiImpulsiveReason: 'Protein serbaguna untuk sarapan dan lauk darurat kilat, mencegah pesan makanan via ojol saat lapar mendadak.',
      isEssential: true,
    },
    {
      id: 'shop_2',
      name: 'Tempe & Tahu Putih Cibuntu',
      quantity: '2 papan tempe + 1 bungkus tahu',
      estimatedPrice: 12000,
      category: 'Protein & Lauk',
      recommendedPlace: 'Pengrajin Tahu Tempe Pasar Atas / Kios Cilame',
      antiImpulsiveReason: 'Lauk kaya protein nabati dan serat, sangat mengenyangkan dengan modal terjangkau.',
      isEssential: true,
    },
    {
      id: 'shop_3',
      name: 'Ikan Kembung Banjar Segar',
      quantity: '500 gram (isi ~4-5 ekor)',
      estimatedPrice: 22000,
      category: 'Protein & Lauk',
      recommendedPlace: 'Lapak Ikan Basah Pasar Atas Baru (pagi subuh)',
      antiImpulsiveReason: 'Kaya omega-3 setara salmon dengan harga lokal terjangkau, sajian lezat keluarga tanpa perlu makan seafood di resto.',
      isEssential: true,
    },
    {
      id: 'shop_4',
      name: 'Sayur Bayam, Kangkung & Jagung Manis',
      quantity: '2 ikat bayam + 2 ikat kangkung + 2 jagung',
      estimatedPrice: 15000,
      category: 'Sayur & Bumbu Segar',
      recommendedPlace: 'Pedagang Sayur Petani Cisarua di Jl. Haji Ghofur / PakuHaji',
      antiImpulsiveReason: 'Sayuran segar harga kebun langsung memenuhi serat 4 hari, menjaga stamina dan daya tahan tubuh keluarga.',
      isEssential: true,
    },
    {
      id: 'shop_5',
      name: 'Paket Bumbu Dapur Komplit (Bawang, Cabai, Tomat)',
      quantity: 'Bawang merah 250g, bawang putih 250g, cabai merah keriting 150g',
      estimatedPrice: 25000,
      category: 'Sayur & Bumbu Segar',
      recommendedPlace: 'Pasar Antri Baru / Pasar Kaget Cilame Permai',
      antiImpulsiveReason: 'Kunci kelezatan masakan rumah; bumbu melimpah membuat hidangan rumahan terasa mewah seperti masakan resto.',
      isEssential: true,
    },
    {
      id: 'shop_6',
      name: 'Beras Premium Setra Ramos / SPHP Bulog',
      quantity: '5 kg',
      estimatedPrice: 72500,
      category: 'Sembako & Pangan Pokok',
      recommendedPlace: 'Toko Beras Pasar Atas / Agen Sembako Borma Gandawijaya',
      antiImpulsiveReason: 'Fondasi utama ketahanan pangan rumah tangga untuk jaminan kenyang seluruh anggota keluarga.',
      isEssential: true,
    },
    {
      id: 'shop_7',
      name: 'Minyak Goreng Sawit Pouch Refill',
      quantity: '1 pouch (2 Liter)',
      estimatedPrice: 34000,
      category: 'Sembako & Pangan Pokok',
      recommendedPlace: 'Borma Gandawijaya / Borma Kerkof (Promo JSM)',
      antiImpulsiveReason: 'Membeli pouch 2L di toserba jauh lebih hemat dibanding beli eceran botol kecil berulang di minimarket.',
      isEssential: true,
    },
    {
      id: 'shop_8',
      name: 'Sabun Cuci Piring & Deterjen Refill Hemat',
      quantity: '1 pouch besar (750 ml / 800 gr)',
      estimatedPrice: 18000,
      category: 'Kebutuhan Esensial Rumah',
      recommendedPlace: 'Borma Toserba Cimahi (Lorong Houseware)',
      antiImpulsiveReason: 'Kebutuhan sanitasi rumah tangga esensial, mencegah bolak-balik beli satuan yang mahal.',
      isEssential: true,
    },
    {
      id: 'shop_9',
      name: 'Pisang Cavendish Lokal / Pepaya California',
      quantity: '1 sisir pisang atau 1 buah pepaya utuh',
      estimatedPrice: 16000,
      category: 'Camilan Sehat & Buah',
      recommendedPlace: 'Super Indo Sangkuriang (Diskon Buah Segar) / Kios Buah Cipageran',
      antiImpulsiveReason: 'Camilan sehat manis alami untuk anak & pasangan, menekan keinginan beli jajanan boba, es krim atau snack pabrikan.',
      isEssential: false,
    },
  ];

  const total = items.reduce((sum, item) => sum + item.estimatedPrice, 0);

  return {
    weeklyAllocation: targetWeekly,
    totalEstimatedCost: total,
    remainingBudget,
    periodName: 'Rencana Belanja Cerdas 7 Hari Cimahi',
    cimahiMarketInsight:
      'Pasokan sayuran segar dari kawasan Cisarua dan Lembang ke jalur Haji Ghofur & Pasar Atas Cimahi sedang melimpah dengan harga sangat bersahabat. Promo sembako akhir pekan di Borma Toserba dan Super Indo Sangkuriang dapat dimanfaatkan untuk mengunci harga bahan pokok.',
    items,
    expertTip:
      'Bawalah daftar ini dalam genggaman ponsel saat berbelanja. Berbelanjalah setelah sarapan agar tidak tergoda aroma jajanan, dan prioritaskan mencentang bahan pangan segar terlebih dahulu sebelum melirik barang lainnya.',
  };
}

export const SmartShoppingListSection: React.FC<SmartShoppingListSectionProps> = ({
  config,
  dailyStatus,
  transactions,
  remainingBudget,
  onOpenAddTransaction,
  onToast,
}) => {
  const [plan, setPlan] = useState<SmartShoppingPlan | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOPPING_PLAN);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKED_ITEMS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marketMode, setMarketMode] = useState<boolean>(false);
  const [userPreference, setUserPreference] = useState<string>('balanced');
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync checked items to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHECKED_ITEMS, JSON.stringify(checkedIds));
  }, [checkedIds]);

  // Sync plan to local storage
  useEffect(() => {
    if (plan) {
      localStorage.setItem(STORAGE_KEY_SHOPPING_PLAN, JSON.stringify(plan));
    }
  }, [plan]);

  // Initial fetch if no plan cached
  useEffect(() => {
    if (!plan) {
      fetchSmartShoppingList('balanced');
    }
  }, []);

  const fetchSmartShoppingList = async (preference = userPreference) => {
    setIsLoading(true);
    try {
      // Build financial context
      const currentMonthStr = config.month;
      const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));
      const categoriesBreakdown: Record<string, number> = {};
      currentMonthTx
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          categoriesBreakdown[t.category] = (categoriesBreakdown[t.category] || 0) + t.amount;
        });

      const todayStr = new Date().toISOString().split('T')[0];
      const todayExpense = transactions
        .filter((t) => t.date === todayStr && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      const preferenceMap: Record<string, string> = {
        balanced: 'Menu 7 Hari Seimbang: Gizi prima, higienis & belanja hemat pasar lokal Cimahi',
        budget_saver: 'Hemat Maksimal: Utamakan protein nabati, sayur petani jalur Haji Ghofur, dan promo sembako Borma',
        kids_family: 'Keluarga & Anak Balita: Variasi lauk lembut kaya protein, buah segar lokal, dan camilan sehat buatan rumah',
        pantry_stock: 'Stok Dapur 7 Hari: Fokus beras, minyak, bumbu komplet, dan bahan tahan lama',
      };

      const contextPayload = {
        monthlyBudget: config.monthlyBudget,
        totalIncome: 0,
        totalExpense: config.monthlyBudget - remainingBudget,
        remainingBudget,
        daysInMonth: dailyStatus.daysInMonth,
        currentDay: dailyStatus.currentDay,
        remainingDays: dailyStatus.remainingDays,
        dailyLimit: dailyStatus.dailyLimit,
        todayExpense,
        categoriesBreakdown,
        recentTransactions: transactions.slice(0, 5),
        cityContext: config.cityContext || 'Cimahi & KBB',
      };

      const response = await fetch('/api/gemini/smart-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: contextPayload,
          userPreference: preferenceMap[preference] || preferenceMap.balanced,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const responseText = await response.text();
      let data: any = null;
      try {
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        }
      } catch (parseErr: any) {
        console.warn('Respons bukan format JSON valid, beralih ke rekomendasi lokal Cimahi.');
      }

      if (data && data.success && data.plan) {
        setPlan(data.plan);
        // Reset checklist for new plan
        setCheckedIds({});
        onToast('Smart Shopping List mingguan berhasil diperbarui oleh Gemini AI!', 'success');
      } else {
        const fallbackPlan = createLocalFallbackPlan(remainingBudget, preference);
        setPlan(fallbackPlan);
        onToast('Daftar belanja cerdas rekomendasi lokal Cimahi siap digunakan.', 'info');
      }
    } catch (err: any) {
      console.warn('Menggunakan fallback lokal untuk Smart Shopping List:', err?.message || err);
      const fallbackPlan = createLocalFallbackPlan(remainingBudget, preference);
      setPlan(fallbackPlan);
      onToast('Daftar belanja cerdas rekomendasi lokal Cimahi siap digunakan.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemCheck = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleResetChecklist = () => {
    if (window.confirm('Reset semua centang belanja agar siap digunakan kembali?')) {
      setCheckedIds({});
      onToast('Checklist belanja telah di-reset.', 'info');
    }
  };

  const items = plan?.items || [];
  const totalItems = items.length;
  const checkedCount = items.filter((i) => checkedIds[i.id]).length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const purchasedAmount = items
    .filter((i) => checkedIds[i.id])
    .reduce((sum, i) => sum + i.estimatedPrice, 0);

  const totalEstimatedCost = plan?.totalEstimatedCost || items.reduce((s, i) => s + i.estimatedPrice, 0);

  // Filter items
  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  // Categories present in items
  const categoriesList: ShoppingCategory[] = [
    'Protein & Lauk',
    'Sayur & Bumbu Segar',
    'Sembako & Pangan Pokok',
    'Kebutuhan Esensial Rumah',
    'Camilan Sehat & Buah',
  ];

  // Copy to WhatsApp text format
  const handleCopyWhatsApp = () => {
    if (!plan) return;

    let text = `🛒 *SMART SHOPPING LIST MINGGUAN (M-BER CIMAHI)*\n`;
    text += `📅 Rencana: ${plan.periodName}\n`;
    text += `💰 Estimasi Anggaran 7 Hari: Rp ${plan.weeklyAllocation.toLocaleString('id-ID')}\n`;
    text += `🛍️ Total Estimasi: Rp ${totalEstimatedCost.toLocaleString('id-ID')}\n`;
    text += `----------------------------------------\n\n`;

    categoriesList.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      if (catItems.length > 0) {
        text += `*${cat.toUpperCase()}*\n`;
        catItems.forEach((i) => {
          const checkMark = checkedIds[i.id] ? '✅' : '⬜';
          text += `${checkMark} ${i.name} (${i.quantity})\n`;
          text += `   ~ Rp ${i.estimatedPrice.toLocaleString('id-ID')} | Lokasi: ${i.recommendedPlace}\n`;
        });
        text += `\n`;
      }
    });

    text += `💡 *Tips Anti-Impulsif Pakar Keuangan:*\n_${plan.expertTip}_\n\n`;
    text += `_Disusun otomatis oleh M-Ber Smart Shopping List didukung Gemini AI_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onToast('Daftar belanja berhasil disalin! Siap dikirim ke WhatsApp pasangan.', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleRecordPurchasedAsTransaction = () => {
    if (purchasedAmount <= 0) {
      onToast('Centang minimal satu barang yang sudah dibeli terlebih dahulu.', 'warning');
      return;
    }
    if (onOpenAddTransaction) {
      const purchasedNames = items
        .filter((i) => checkedIds[i.id])
        .map((i) => i.name)
        .slice(0, 3)
        .join(', ');
      onOpenAddTransaction({
        amount: purchasedAmount,
        category: 'Bahan Pokok & Pasar',
        description: `Belanja Pasar Mingguan Cimahi (${checkedCount} item: ${purchasedNames}...)`,
        type: 'expense',
      });
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
              Gemini AI Shopping Assistant
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Pasar & Toserba Cimahi
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Smart Shopping List Mingguan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar belanja 7 hari yang dirancang agar uang dapur cukup dan keluarga terhindar dari belanja impulsif.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Market Mode Button (Large touch targets for market shopping) */}
          <button
            type="button"
            onClick={() => setMarketMode(!marketMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
              marketMode
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Aktifkan tampilan checklist besar saat berbelanja di pasar"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{marketMode ? 'Mode Pasar: Aktif' : 'Mode Belanja Pasar'}</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Salin daftar belanja ke WhatsApp pasangan"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">{copied ? 'Tersalin ✓' : 'Salin WhatsApp'}</span>
            <span className="sm:hidden">{copied ? 'Tersalin' : 'WA'}</span>
          </button>

          {/* Regenerate Gemini Button */}
          <button
            type="button"
            onClick={() => fetchSmartShoppingList()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            title="Minta Gemini AI menyusun ulang daftar belanja berdasarkan sisa anggaran terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Menyusun...' : 'Perbarui AI'}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS & BUDGET PACING TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            Sisa Anggaran Bulanan
          </p>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Rp {remainingBudget.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">Sisa {dailyStatus.remainingDays} hari</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/40 space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-teal-700 dark:text-teal-300">
            Porsi 7 Hari (AI Plan)
          </p>
          <p className="text-base sm:text-lg font-black text-teal-700 dark:text-teal-300">
            Rp {(plan?.weeklyAllocation || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-teal-600/80">Alokasi seimbang mingguan</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300">
            Total Estimasi Belanja
          </p>
          <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">
            Rp {totalEstimatedCost.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-emerald-600/80">{totalItems} item kebutuhan dapur</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-300">
            Progres Belanja Riil
          </p>
          <p className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-200">
            {checkedCount} / {totalItems} <span className="text-xs font-normal">terbeli</span>
          </p>
          <p className="text-[10px] text-amber-600/80">Rp {purchasedAmount.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* 3. PROGRESS BAR & PREFERENCES COLLAPSIBLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Checklist Belanja: {progressPct}% Selesai
          </span>
          <div className="flex items-center space-x-3 text-[11px]">
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={handleRecordPurchasedAsTransaction}
                className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                Catat Pengeluaran (Rp {purchasedAmount.toLocaleString('id-ID')})
              </button>
            )}
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={handleResetChecklist}
                className="text-slate-500 hover:text-rose-600 transition cursor-pointer"
              >
                Reset Ceklis
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Opsi Preferensi</span>
              {showPreferences ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Preference Picker Dropdown Container */}
        {showPreferences && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in duration-200">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Pilih Fokus Rencana Belanja Gemini AI:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'balanced',
                  title: 'Seimbang & Bergizi',
                  desc: 'Kombinasi lauk protein, sayur segar & bumbu lengkap',
                },
                {
                  id: 'budget_saver',
                  title: 'Hemat Maksimal',
                  desc: 'Prioritaskan protein nabati & sayur kebun petani',
                },
                {
                  id: 'kids_family',
                  title: 'Anak & Balita',
                  desc: 'Menu bergizi ramah anak, buah & camilan sehat',
                },
                {
                  id: 'pantry_stock',
                  title: 'Stok Dapur 7 Hari',
                  desc: 'Fokus bahan pokok kering & sembako awet',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setUserPreference(opt.id);
                    fetchSmartShoppingList(opt.id);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer text-xs ${
                    userPreference === opt.id
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold flex items-center justify-between">
                    <span>{opt.title}</span>
                    {userPreference === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. CIMAHI MARKET INSIGHT & ANTI-IMPULSIVE BUYING WISDOM */}
      {plan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Market Insight Tile */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/60 to-emerald-50/60 dark:from-teal-950/25 dark:to-emerald-950/25 border border-teal-200/60 dark:border-teal-900/40 space-y-1.5">
            <div className="flex items-center space-x-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
              <Store className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Tren Harga Pangan Wilayah Cimahi</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              {plan.cimahiMarketInsight}
            </p>
          </div>

          {/* Anti-Impulsive Guidance Tile */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-950/25 dark:to-orange-950/25 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Panduan Mengayomi: Cegah Belanja Impulsif</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              {plan.expertTip}
            </p>
          </div>
        </div>
      )}

      {/* 5. CATEGORY FILTER PILLS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Semua Item ({items.length})
        </button>

        {categoriesList.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          if (count === 0) return null;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 6. SHOPPING LIST CARDS / CHECKLIST */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="w-7 h-7 text-emerald-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Gemini AI sedang menghitung harga pasar Cimahi & merancang menu 7 hari...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Tidak ada item belanja dalam kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const isChecked = Boolean(checkedIds[item.id]);

            return (
              <div
                key={item.id}
                onClick={() => toggleItemCheck(item.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 select-none ${
                  isChecked
                    ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
                } ${marketMode ? 'p-5 sm:p-5' : ''}`}
              >
                {/* Checkbox Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItemCheck(item.id);
                  }}
                  className={`mt-0.5 shrink-0 rounded-lg transition ${
                    marketMode ? 'scale-125 mr-1' : ''
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-emerald-500" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight ${
                          isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        } ${marketMode ? 'text-sm sm:text-base' : ''}`}
                      >
                        {item.name}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Takaran: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.quantity}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
                        Rp {item.estimatedPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Market Place Recommendation */}
                  <div className="flex items-center space-x-1.5 text-[10px] text-teal-700 dark:text-teal-300">
                    <Store className="w-3 h-3 shrink-0 text-teal-600" />
                    <span className="truncate">{item.recommendedPlace}</span>
                  </div>

                  {/* Anti-Impulsive Rationale Note */}
                  {!marketMode && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-snug">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Anti-Impulsif: </span>
                      {item.antiImpulsiveReason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. BOTTOM ACTION BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              Total Pembelian yang Dicentang: Rp {purchasedAmount.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {checkedCount} dari {totalItems} item telah dibeli.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenAddTransaction && (
            <button
              type="button"
              onClick={handleRecordPurchasedAsTransaction}
              disabled={purchasedAmount === 0}
              className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simpan ke Pengeluaran Riil</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
