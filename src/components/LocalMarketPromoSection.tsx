import React, { useState, useMemo, useEffect } from 'react';
import {
  Store,
  Tag,
  MapPin,
  Sparkles,
  Search,
  Plus,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  Clock,
  TrendingDown,
  CheckCircle2,
  Gift,
  HelpCircle,
  X,
} from 'lucide-react';

export interface MarketPromoItem {
  id: string;
  storeName: string;
  category: 'supermarket' | 'pasar' | 'sembako';
  title: string;
  description: string;
  priceNote: string;
  schedule: string;
  region: string;
  tips: string;
  isUserAdded?: boolean;
}

interface LocalMarketPromoSectionProps {
  cityContext: string;
  onUpdateCityContext: (newCity: string) => void;
  onOpenAddTransaction?: (prefillDesc: string, prefillCat?: string) => void;
  onToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

// Data Wilayah Standar Seluruh Indonesia
export const INDONESIA_REGIONS = [
  {
    id: 'jabodetabek',
    name: 'Jabodetabek & Banten',
    cities: 'Jakarta, Bogor, Depok, Tangerang, Bekasi, Serang',
    stores: 'Indomaret, Alfamart, Super Indo, Hypermart, Pasar Induk Kramat Jati, Tip Top',
  },
  {
    id: 'jabar',
    name: 'Jawa Barat',
    cities: 'Bandung, Cimahi, Cirebon, Sukabumi, Karawang, KBB, Garut, Tasikmalaya',
    stores: 'Borma Toserba, Yogya / Griya, Super Indo, Pasar Atas Baru, Pasar Induk Gedebage',
  },
  {
    id: 'jateng_diy',
    name: 'Jawa Tengah & D.I. Yogyakarta',
    cities: 'Semarang, Solo/Surakarta, Yogyakarta, Magelang, Banyumas, Tegal, Pekalongan',
    stores: 'Luwes, Mirota Kampus, Super Indo, Pasar Beringharjo, Pasar Johar, Pasar Gede',
  },
  {
    id: 'jatim',
    name: 'Jawa Timur',
    cities: 'Surabaya, Malang, Sidoarjo, Kediri, Jember, Banyuwangi, Madiun',
    stores: 'Super Indo, Sakinah, Bonnet, Pasar Keputran, Pasar Besar Malang, Indomaret Fresh',
  },
  {
    id: 'sumatera',
    name: 'Sumatera',
    cities: 'Medan, Palembang, Pekanbaru, Padang, Bandar Lampung, Batam, Banda Aceh',
    stores: 'Suzuya, Maju Bersama, Diamond, Pasar Pusat Pasar Medan, Pasar 16 Ilir Palembang',
  },
  {
    id: 'bali_nusra',
    name: 'Bali & Nusa Tenggara',
    cities: 'Denpasar, Badung, Gianyar, Mataram, Kupang, Singaraja',
    stores: 'Tiara Dewata, Hardy’s, Bintang Supermarket, Pasar Badung, Pasar Kebon Roek',
  },
  {
    id: 'kalimantan',
    name: 'Kalimantan',
    cities: 'Balikpapan, Samarinda, Banjarmasin, Pontianak, Palangka Raya, Tarakan',
    stores: 'Maxi Swalayan, Lotte Mart, Pasar Segiri Samarinda, Pasar Klandasan Balikpapan',
  },
  {
    id: 'sulawesi',
    name: 'Sulawesi',
    cities: 'Makassar, Manado, Palu, Kendari, Gorontalo, Parepare',
    stores: 'Gelael, Top Mode, Multimart Manado, Pasar Terong Makassar, Pasar Bersehati',
  },
  {
    id: 'maluku_papua',
    name: 'Maluku & Papua',
    cities: 'Ambon, Jayapura, Sorong, Merauke, Manokwari',
    stores: 'Mega Supermarket, Saga Mall Jayapura, Pasar Mardika Ambon, Pasar Youtefa',
  },
];

// Katalog Promo Standar Per Wilayah di Seluruh Indonesia
const BASE_PROMOS: MarketPromoItem[] = [
  // NASIONAL / SEMUA WILAYAH
  {
    id: 'p_jsm_minyak',
    storeName: 'Indomaret / Alfamart (Nasional)',
    category: 'supermarket',
    title: 'Promo JSM Minyak Goreng 2 Liter Hemat',
    description: 'Diskon akhir pekan minyak goreng pouch 2L (Filma, Sania, Bimoli, Tropical).',
    priceNote: 'Mulai Rp 32.900 - Rp 34.500 (Turun dari Rp 38.000)',
    schedule: 'Jumat, Sabtu, & Minggu (JSM)',
    region: 'Semua Wilayah Indonesia',
    tips: 'Gunakan pembayaran QRIS/E-Wallet untuk ekstra potongan Rp 1.000 - Rp 2.000.',
  },
  {
    id: 'p_beras_sphp',
    storeName: 'Bulog & Pasar Tradisional / Rumah Pangan Kita',
    category: 'sembako',
    title: 'Beras SPHP Stabilisasi Pasokan & Harga Pangan',
    description: 'Beras medium kualitas bagus dari Bulog kemasan 5 kg resmi sesuai HET pemerintah.',
    priceNote: 'Rp 62.500 / zak 5 kg (Maks. 2 zak per KTP/pembeli)',
    schedule: 'Setiap Hari (Selama stok tersedia)',
    region: 'Semua Wilayah Indonesia',
    tips: 'Datang pagi hari ke mitra resmi Bulog atau kios pangan pasar terdekat.',
  },
  {
    id: 'p_telur_ayam',
    storeName: 'Pasar Tradisional & Agen Telur Lokal',
    category: 'sembako',
    title: 'Harga Telur Ayam Ras Langsung Peternak',
    description: 'Telur ayam segar cangkang tebal langsung dari pasokan peternak lokal.',
    priceNote: 'Rp 26.500 - Rp 28.000 / kg (Beli per papan/krat lebih murah)',
    schedule: 'Buka Jam 05.00 - 11.00 Pagi',
    region: 'Semua Wilayah Indonesia',
    tips: 'Pilih telur dengan cangkang berbintik halus dan tidak mengkilap sebagai tanda kesegaran.',
  },

  // JAWA BARAT & CIMAHI / BANDUNG
  {
    id: 'p_jabar_borma',
    storeName: 'Borma Toserba (Jawa Barat / Cimahi / Bandung)',
    category: 'supermarket',
    title: 'Promo Borma Belanja Hemat Awal & Akhir Pekan',
    description: 'Diskon sabun cuci piring, deterjen bubuk/cair, susu UHT anak, dan bumbu dapur.',
    priceNote: 'Potongan hingga 25% produk kebutuhan rumah tangga',
    schedule: 'Setiap Hari (Kamis - Minggu Promo Spesial)',
    region: 'Jawa Barat',
    tips: 'Cek area produk promo di lorong tengah sebelum ambil barang kebutuhan rutin.',
  },
  {
    id: 'p_jabar_sayur_pasar',
    storeName: 'Pasar Tradisional (Pasar Atas / Ciroyom / Petani Lokal)',
    category: 'pasar',
    title: 'Paket Sayur Segar Sop & Sayur Asem Murah',
    description: 'Pasokan sayur kol, wortel, buncis, kentang, dan daun seledri segar pasokan Lembang/Cisarua.',
    priceNote: 'Rp 3.000 - Rp 5.000 per bungkus komplit',
    schedule: 'Paling Segar Jam 05.30 - 08.00 Pagi',
    region: 'Jawa Barat',
    tips: 'Belanja sayur sebelum jam 8 pagi untuk dapat sayuran daun yang belum layu.',
  },

  // JABODETABEK
  {
    id: 'p_jkt_superindo',
    storeName: 'Super Indo (Jabodetabek)',
    category: 'supermarket',
    title: 'Super Hemat Aneka Ikan & Daging Segar',
    description: 'Diskon ayam broiler utuh, ikan gurame, daging rendang, dan buah segar lokal.',
    priceNote: 'Ayam utuh Rp 31.900/ekor (Hemat 20%)',
    schedule: 'Jumat - Minggu (Promo Super Fresh)',
    region: 'Jabodetabek & Banten',
    tips: 'Minta layanan potong ayam dan bersihkan ikan gratis di counter fresh.',
  },
  {
    id: 'p_jkt_kramat_jati',
    storeName: 'Pasar Induk Kramat Jati / Pasar Tradisional',
    category: 'pasar',
    title: 'Cabai Merah & Bawang Merah Brebes Murah',
    description: 'Beli cabai rawit merah dan bawang merah dalam jumlah mingguan (1/2 kg ke atas).',
    priceNote: 'Bawang Brebes Rp 32.000/kg (eceran luar Rp 40.000)',
    schedule: 'Subuh Jam 04.00 - 08.30',
    region: 'Jabodetabek & Banten',
    tips: 'Simpan bawang di wadah berangin tanpa plastik agar tahan hingga 3 minggu.',
  },

  // JAWA TENGAH & DIY
  {
    id: 'p_jateng_mirota_luwes',
    storeName: 'Luwes Swalayan / Mirota Kampus (Jateng & Jogja)',
    category: 'supermarket',
    title: 'Harga Murah Pangan Pokok & Snack Anak',
    description: 'Gula pasir, tepung terigu Bogasari, mi instan kardusan, dan kecap manis.',
    priceNote: 'Harga grosir bisa dibeli eceran',
    schedule: 'Buka Jam 08.30 - 21.00',
    region: 'Jawa Tengah & D.I. Yogyakarta',
    tips: 'Bandingkan harga per gram untuk minyak goreng dan deterjen agar dapat nilai terbaik.',
  },

  // JAWA TIMUR
  {
    id: 'p_jatim_keputran',
    storeName: 'Pasar Keputran / Pasar Tradisional Jatim',
    category: 'pasar',
    title: 'Sayur Mayur & Tahu Tempe Segar Murah',
    description: 'Tahu putih sutra, tempe papan kedelai murni, dan sayuran segar Malang/Batu.',
    priceNote: 'Tempe papan jumbo Rp 7.000, Tahu 1 bks isi 10 Rp 5.000',
    schedule: 'Buka Jam 05.00 - 10.00 Pagi',
    region: 'Jawa Timur',
    tips: 'Rendam tahu dalam air matang campur sedikit garam di kulkas agar awet 5 hari.',
  },

  // SUMATERA
  {
    id: 'p_sumatera_pasar',
    storeName: 'Pasar Tradisional Sumatera (Medan, Palembang, Padang)',
    category: 'pasar',
    title: 'Ikan Laut Segar & Bumbu Rempah Dapur',
    description: 'Ikan tongkol, dencis, gembung segar hasil tangkapan nelayan lokal.',
    priceNote: 'Ikan dencis Rp 28.000/kg, Ikan tongkol Rp 25.000/kg',
    schedule: 'Pagi Hari Jam 06.00 - 09.30',
    region: 'Sumatera',
    tips: 'Beli rempah halus giling segar di pasar untuk hemat waktu masak sehari-hari.',
  },
];

const STORAGE_KEY_USER_PROMOS = 'mber_user_community_promos_v1';

export const LocalMarketPromoSection: React.FC<LocalMarketPromoSectionProps> = ({
  cityContext,
  onUpdateCityContext,
  onOpenAddTransaction,
  onToast,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'supermarket' | 'pasar' | 'sembako'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isChangingRegion, setIsChangingRegion] = useState(false);
  const [customRegionInput, setCustomRegionInput] = useState('');
  const [userPromos, setUserPromos] = useState<MarketPromoItem[]>([]);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [newStore, setNewStore] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState<'supermarket' | 'pasar' | 'sembako'>('supermarket');
  const [newTips, setNewTips] = useState('');

  // Load custom promos from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER_PROMOS);
      if (raw) {
        setUserPromos(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save custom promos
  const handleSaveCustomPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.trim() || !newTitle.trim()) return;

    const newPromoItem: MarketPromoItem = {
      id: `custom_${Date.now()}`,
      storeName: newStore.trim(),
      category: newCategory,
      title: newTitle.trim(),
      description: 'Catatan promo hemat dari temuan belanja Bunda.',
      priceNote: newPrice.trim() || 'Harga spesial hemat',
      schedule: 'Info belanja langsung',
      region: cityContext || 'Wilayah Bunda',
      tips: newTips.trim() || 'Tips: Selalu cek tanggal kadaluarsa dan bandingkan harga per unit.',
      isUserAdded: true,
    };

    const updated = [newPromoItem, ...userPromos];
    setUserPromos(updated);
    try {
      localStorage.setItem(STORAGE_KEY_USER_PROMOS, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setIsAddingPromo(false);
    setNewStore('');
    setNewTitle('');
    setNewPrice('');
    setNewTips('');

    if (onToast) {
      onToast('🎉 Berhasil mencatat info promo baru Bunda!', 'success');
    }
  };

  const handleDeleteUserPromo = (id: string) => {
    const updated = userPromos.filter((p) => p.id !== id);
    setUserPromos(updated);
    try {
      localStorage.setItem(STORAGE_KEY_USER_PROMOS, JSON.stringify(updated));
      if (onToast) onToast('Catatan promo dihapus.', 'info');
    } catch {
      // ignore
    }
  };

  // Combine base promos and user promos
  const allPromos = useMemo(() => {
    return [...userPromos, ...BASE_PROMOS];
  }, [userPromos]);

  // Determine current active region category
  const activeRegionMatch = useMemo(() => {
    const lower = cityContext.toLowerCase();
    for (const reg of INDONESIA_REGIONS) {
      if (lower.includes(reg.name.toLowerCase()) || lower.includes(reg.id)) {
        return reg;
      }
      // Check city names
      const cityList = reg.cities.toLowerCase().split(',').map((c) => c.trim());
      if (cityList.some((city) => lower.includes(city))) {
        return reg;
      }
    }
    return null;
  }, [cityContext]);

  // Filter promos by category, search, and region relevance
  const filteredPromos = useMemo(() => {
    return allPromos.filter((item) => {
      // Category filter
      if (selectedFilter !== 'all' && item.category !== selectedFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchStore = item.storeName.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchPrice = item.priceNote.toLowerCase().includes(query);
        if (!matchTitle && !matchStore && !matchDesc && !matchPrice) return false;
      }

      // Region match:
      // If item is 'Semua Wilayah Indonesia' or user-added, always show
      if (item.region === 'Semua Wilayah Indonesia' || item.isUserAdded) return true;

      // If matches active region name
      if (activeRegionMatch && item.region.toLowerCase().includes(activeRegionMatch.name.toLowerCase())) {
        return true;
      }

      // If user typed custom city and matches item region
      if (item.region.toLowerCase().includes(cityContext.toLowerCase())) {
        return true;
      }

      return true; // Default fallback to show useful deals
    });
  }, [allPromos, selectedFilter, searchTerm, activeRegionMatch, cityContext]);

  const handleSelectPredefinedRegion = (reg: (typeof INDONESIA_REGIONS)[0]) => {
    onUpdateCityContext(`${reg.name} (${reg.cities})`);
    setIsChangingRegion(false);
  };

  const handleApplyCustomRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRegionInput.trim()) return;
    onUpdateCityContext(customRegionInput.trim());
    setCustomRegionInput('');
    setIsChangingRegion(false);
  };

  const handleSharePromoWA = (promo: MarketPromoItem) => {
    const text = `🛒 *INFO PROMO HEMAT BELANJA BUNDA (M-BER)*\n` +
      `🏪 Tempat: ${promo.storeName}\n` +
      `🏷️ Promo: ${promo.title}\n` +
      `💰 Harga: ${promo.priceNote}\n` +
      `⏰ Waktu: ${promo.schedule}\n` +
      `💡 Tips: ${promo.tips}\n\n` +
      `_Dibagikan dari aplikasi M-Ber (Dompet Pintar Ibu)_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="promo-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5 animate-in fade-in duration-200 scroll-mt-20">
      {/* Top Banner Header: 100% GRATIS TANPA IKLAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
            <Store className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Promo Supermarket & Pasar Bunda
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <Gift className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                100% Gratis Tanpa Iklan
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau harga sembako murah, diskon JSM mingguan, & sayuran segar di pasar sekitar Bunda.
            </p>
          </div>
        </div>

        {/* Action Button to Add Local Deal */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsAddingPromo(!isAddingPromo)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Promo Temuan</span>
          </button>
        </div>
      </div>

      {/* Region Indicator & Selector Bar */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium shrink-0">
              Wilayah Belanja:
            </span>
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {cityContext || 'Seluruh Indonesia'}
            </span>
          </div>

          <button
            onClick={() => setIsChangingRegion(!isChangingRegion)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <span>{isChangingRegion ? 'Tutup Pilihan' : 'Ganti Wilayah / Kota'}</span>
            {isChangingRegion ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Region Selector Accordion Drawer */}
        {isChangingRegion && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih wilayah tempat tinggal Bunda di seluruh Indonesia untuk menyesuaikan supermarket & pasar lokal terdekat:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {INDONESIA_REGIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => handleSelectPredefinedRegion(reg)}
                  className={`p-2.5 rounded-xl border text-left transition text-xs space-y-0.5 cursor-pointer ${
                    activeRegionMatch?.id === reg.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-400 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-[11px] sm:text-xs flex items-center justify-between">
                    <span>{reg.name}</span>
                    {activeRegionMatch?.id === reg.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {reg.cities}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom City / Sub-district Input */}
            <form onSubmit={handleApplyCustomRegion} className="flex gap-2 pt-1">
              <input
                type="text"
                value={customRegionInput}
                onChange={(e) => setCustomRegionInput(e.target.value)}
                placeholder="Atau ketik nama Kota/Kecamatan/Pasar Bunda sendiri..."
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shrink-0 cursor-pointer shadow-xs"
              >
                Terapkan
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Form: Bunda Tambah Promo Temuan Sendiri */}
      {isAddingPromo && (
        <form
          onSubmit={handleSaveCustomPromo}
          className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/70 border border-emerald-200 dark:border-emerald-900/60 space-y-3 text-xs animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Catat Promo / Diskon yang Bunda Temukan
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingPromo(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Supermarket / Pasar / Kios:
              </label>
              <input
                type="text"
                required
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                placeholder="Contoh: Super Indo / Borma / Pasar Pagi Kios Bu Siti"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Promo:
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="supermarket">Supermarket & Minimarket (JSM)</option>
                <option value="pasar">Pasar Tradisional & Sayur Segar</option>
                <option value="sembako">Sembako Murah (Minyak, Beras, Telur)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barang Promo / Diskon:
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Minyak Goreng 2L Tropical / Telur Ayam Ras"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Promo / Potongan:
              </label>
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Contoh: Rp 32.500 (Turun dari Rp 38.000)"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Tips Tambahan untuk Bunda (Opsional):
            </label>
            <input
              type="text"
              value={newTips}
              onChange={(e) => setNewTips(e.target.value)}
              placeholder="Contoh: Promo berlaku sampai hari Minggu, stok minyak banyak di rak depan"
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingPromo(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 shadow-xs cursor-pointer"
            >
              Simpan Promo Temuan
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua Promo' },
            { id: 'supermarket', label: 'Supermarket & JSM' },
            { id: 'pasar', label: 'Pasar Tradisional' },
            { id: 'sembako', label: 'Sembako Murah' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari promo sembako..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Promo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPromos.map((promo) => {
          const isSupermarket = promo.category === 'supermarket';
          const isSembako = promo.category === 'sembako';

          return (
            <div
              key={promo.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group shadow-2xs hover:shadow-xs ${
                promo.isUserAdded
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/80'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50'
              }`}
            >
              <div className="space-y-2">
                {/* Card Header Tag & Category */}
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                      isSupermarket
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : isSembako
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>
                      {isSupermarket
                        ? 'Supermarket / JSM'
                        : isSembako
                        ? 'Sembako Murah'
                        : 'Pasar Tradisional'}
                    </span>
                  </span>

                  {promo.isUserAdded ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                      Temuan Bunda
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {promo.schedule}
                    </span>
                  )}
                </div>

                {/* Store Name & Promo Title */}
                <div>
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{promo.storeName}</span>
                  </p>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {promo.title}
                  </h4>
                </div>

                {/* Price Tag Highlight */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Info Harga Promo:
                  </span>
                  <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {promo.priceNote}
                  </p>
                </div>

                {/* Description & Tips */}
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {promo.description}
                </p>

                {promo.tips && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/50 dark:border-amber-900/40 leading-relaxed">
                    💡 <strong>Tips Cerdas:</strong> {promo.tips}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleSharePromoWA(promo)}
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  title="Bagikan promo ini ke WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bagikan WA</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  {promo.isUserAdded && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUserPromo(promo.id)}
                      className="text-[10px] text-rose-500 hover:underline px-1.5 py-0.5"
                    >
                      Hapus
                    </button>
                  )}

                  {onOpenAddTransaction && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenAddTransaction(
                          `Belanja ${promo.title} di ${promo.storeName}`,
                          'Makanan & Minuman'
                        )
                      }
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Catat Belanja</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
