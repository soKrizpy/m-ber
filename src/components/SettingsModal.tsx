import React, { useState } from 'react';
import {
  X,
  Settings,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight,
  ShoppingBag,
  MapPin,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import {
  BudgetConfig,
  CategoryNotificationRule,
  EXPENSE_CATEGORIES,
} from '../types/finance.ts';
import { NotificationService } from '../services/notifications.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onUpdateConfig: (newConfig: BudgetConfig) => void;
  categoryExpenses: Record<string, number>;
  onRulesChanged: () => void;
  themeMode?: 'light' | 'dark' | 'system';
  onThemeModeChange?: (mode: 'light' | 'dark' | 'system') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  categoryExpenses,
  onRulesChanged,
  themeMode = 'light',
  onThemeModeChange,
}) => {
  const [rules, setRules] = useState<CategoryNotificationRule[]>(() =>
    NotificationService.getCategoryRules()
  );

  // Form state for adding new rule
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('Hiburan & Santai');
  const [newThreshold, setNewThreshold] = useState<string>('500000');

  // General config temporary states
  const [thresholdPct, setThresholdPct] = useState(config.warningThresholdPct || 80);
  const [autoDaily, setAutoDaily] = useState(config.autoDailyLimit);
  const [customDaily, setCustomDaily] = useState(config.customDailyLimit?.toString() || '100000');
  const [selectedArea, setSelectedArea] = useState(
    config.cityContext || 'Cimahi & KBB (Haji Ghofur, PakuHaji, Desa Cilame, Ngamprah, Cipageran)'
  );

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
    );
    setRules(updated);
    NotificationService.saveCategoryRules(updated);
    onRulesChanged();
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    NotificationService.saveCategoryRules(updated);
    onRulesChanged();
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newThreshold.replace(/\D/g, ''), 10) || 0;
    if (amount <= 0) return;

    const newRule: CategoryNotificationRule = {
      id: 'rule_' + Date.now(),
      category: newCategory,
      thresholdAmount: amount,
      period: 'monthly',
      isEnabled: true,
      createdAt: Date.now(),
    };

    const updated = [newRule, ...rules];
    setRules(updated);
    NotificationService.saveCategoryRules(updated);
    onRulesChanged();

    setIsAddingRule(false);
    setNewThreshold('500000');
  };

  const handleSaveGeneralSettings = () => {
    const parsedCustom = parseInt(customDaily.replace(/\D/g, ''), 10) || 100000;
    onUpdateConfig({
      ...config,
      warningThresholdPct: thresholdPct,
      autoDailyLimit: autoDaily,
      customDailyLimit: parsedCustom,
      cityContext: selectedArea,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan & Aturan Notifikasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kustomisasi limit per kategori dan notifikasi peringatan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: Category Notification Rules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Aturan Batas Kategori (Category Alert Rules)
              </h3>
            </div>
            {!isAddingRule && (
              <button
                onClick={() => setIsAddingRule(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Aturan</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Aplikasi akan otomatis mengirim notifikasi peringatan jika belanja pada kategori tertentu melebihi atau mendekati nominal batas yang Anda tetapkan.
          </p>

          {/* Add Rule Form */}
          {isAddingRule && (
            <form
              onSubmit={handleCreateRule}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs animate-in fade-in"
            >
              <h4 className="font-bold text-slate-900 dark:text-white">
                Tambah Aturan Notifikasi Kategori Baru
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Kategori:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Batas Maksimal Pengeluaran (Rp):
                  </label>
                  <input
                    type="text"
                    value={
                      newThreshold
                        ? parseInt(newThreshold.replace(/\D/g, ''), 10).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => setNewThreshold(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 500000"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Quick preset threshold amounts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 self-center">Pilihan cepat:</span>
                {[300000, 500000, 1000000, 1500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNewThreshold(amt.toString())}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-500"
                  >
                    Rp {(amt / 1000).toLocaleString('id-ID')}rb
                  </button>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          )}

          {/* List of Rules */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {rules.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                Belum ada aturan notifikasi kategori yang dibuat.
              </div>
            ) : (
              rules.map((rule) => {
                const spent = categoryExpenses[rule.category] || 0;
                const isOver = spent >= rule.thresholdAmount;
                const percent = Math.min(100, Math.round((spent / (rule.thresholdAmount || 1)) * 100));

                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                      !rule.isEnabled
                        ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                        : isOver
                        ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {rule.category}
                        </span>
                        {isOver && rule.isEnabled && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                            LEWAT BATAS
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          Terpakai: <strong className={isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                            Rp {spent.toLocaleString('id-ID')}
                          </strong>
                        </span>
                        <span>/</span>
                        <span>Batas: Rp {rule.thresholdAmount.toLocaleString('id-ID')}</span>
                        <span>({percent}%)</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Toggle and Delete actions */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        title={rule.isEnabled ? 'Nonaktifkan aturan' : 'Aktifkan aturan'}
                      >
                        {rule.isEnabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                        title="Hapus aturan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: Daily Pacing Warning Settings */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Pengaturan Limit Harian & Waspada
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Ambang Peringatan Limit Harian (%):
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={thresholdPct}
                  onChange={(e) => setThresholdPct(parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-600"
                />
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 w-12 text-right">
                  {thresholdPct}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Notifikasi dikirim saat belanja hari ini mencapai persentase batas kuota harian ini.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Hitung Limit Harian Otomatis (30 Hari)
                </p>
                <p className="text-[10px] text-slate-400">
                  Membagi sisa anggaran dengan sisa hari yang ada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoDaily(!autoDaily)}
                className="p-1 rounded-lg"
              >
                {autoDaily ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: Local Area Coverage Setting */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Cakupan Area Promo Supermarket & Pasar Lokal
            </h3>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Kang Tambal dan Tips Harian akan mencari promo supermarket terdekat dan substitusi pangan murah sesuai wilayah pilihan Anda:
          </p>

          <div className="space-y-2">
            {[
              {
                id: 'full_kbb_cimahi',
                label: 'Kabupaten Bandung Barat & Cimahi (Lengkap)',
                desc: 'Jl. Haji Ghofur, PakuHaji, Desa Cilame, Kec. Ngamprah, Cipageran, Pasar Atas, Super Indo, & Borma',
                value: 'Cimahi & KBB (Haji Ghofur, PakuHaji, Desa Cilame, Kec. Ngamprah, Cipageran)',
              },
              {
                id: 'kbb_focus',
                label: 'Fokus KBB (Haji Ghofur, PakuHaji, Cilame, Ngamprah)',
                desc: 'Prioritaskan diskon minimarket/supermarket & petani lokal jalur H. Ghofur, PakuHaji, Cilame, & Kompleks Pemkab KBB Ngamprah',
                value: 'KBB Area Haji Ghofur, PakuHaji, Desa Cilame, Kecamatan Ngamprah',
              },
              {
                id: 'cipageran_cimahi',
                label: 'Cipageran & Cimahi Utara - Tengah',
                desc: 'Pasar Atas Baru, Super Indo Sangkuriang, Borma Gandawijaya, & toko sembako Cipageran',
                value: 'Cipageran & Cimahi (Pasar Atas, Borma, Super Indo)',
              },
            ].map((area) => (
              <label
                key={area.id}
                onClick={() => setSelectedArea(area.value)}
                className={`p-3 rounded-2xl border cursor-pointer block transition ${
                  selectedArea === area.value
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {area.label}
                  </span>
                  <input
                    type="radio"
                    name="areaSelection"
                    checked={selectedArea === area.value}
                    onChange={() => setSelectedArea(area.value)}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {area.desc}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 4: Theme Mode (Mode Tampilan: Terang / Gelap / Sistem) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Tema Tampilan Aplikasi (Theme Mode)
            </h3>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Pilih mode terang untuk tampilan bersih dan cerah di siang hari, atau mode gelap untuk kenyamanan mata di malam hari:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'light' as const,
                title: 'Mode Terang (Light)',
                desc: 'Tampilan cerah, bersih & nyaman dibaca',
                icon: Sun,
                color: 'text-amber-500',
              },
              {
                id: 'dark' as const,
                title: 'Mode Gelap (Dark)',
                desc: 'Kontras gelap, hemat baterai OLED',
                icon: Moon,
                color: 'text-indigo-400',
              },
              {
                id: 'system' as const,
                title: 'Otomatis Sistem',
                desc: 'Mengikuti pengaturan browser/HP',
                icon: Monitor,
                color: 'text-emerald-500',
              },
            ].map((item) => {
              const isSelected = themeMode === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onThemeModeChange && onThemeModeChange(item.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/50 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs ${item.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {item.title}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSaveGeneralSettings}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
