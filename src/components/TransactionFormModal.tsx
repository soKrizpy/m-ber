import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  AlertTriangle,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  GraduationCap,
  Smile,
  CreditCard,
  HandHeart,
  MoreHorizontal,
  Wallet,
  Store,
  Briefcase,
  Gift,
  TrendingUp,
} from 'lucide-react';
import {
  TransactionType,
  PaymentMethod,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  DailyLimitStatus,
} from '../types/finance.ts';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    date: string;
    time: string;
  }) => void;
  dailyStatus: DailyLimitStatus;
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Car: <Car className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  HeartPulse: <HeartPulse className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  Smile: <Smile className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  HandHeart: <HandHeart className="w-4 h-4" />,
  MoreHorizontal: <MoreHorizontal className="w-4 h-4" />,
  Wallet: <Wallet className="w-4 h-4" />,
  Store: <Store className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Gift: <Gift className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
};

const CIMAHI_QUICK_TAGS = [
  'Pasar Antri Baru Cimahi',
  'Pasar Atas Baru Cimahi',
  'Borma Gandawijaya',
  'Super Indo Cimahi',
  'Pertalite SPBU Baros',
  'Token Listrik PLN',
  'Warung Sembako Madura',
  'Lontong Kari / Kupat Tahu Cimahi',
];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dailyStatus,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('Makanan & Minuman');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS / E-Wallet');
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>(timeStr);

  if (!isOpen) return null;

  const numAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  
  // Real-time calculation: What would today's total become with this expense?
  const projectedTodayExpense = type === 'expense' ? dailyStatus.todayExpense + numAmount : dailyStatus.todayExpense;
  const willExceedDailyLimit = type === 'expense' && projectedTodayExpense > dailyStatus.dailyLimit && numAmount > 0;
  const willNearDailyLimit =
    type === 'expense' &&
    !willExceedDailyLimit &&
    projectedTodayExpense >= dailyStatus.dailyLimit * 0.8 &&
    numAmount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    onSubmit({
      type,
      category,
      amount: numAmount,
      description: description.trim() || category,
      paymentMethod,
      date,
      time,
    });

    // Reset fields
    setAmount('');
    setDescription('');
    onClose();
  };

  const handleQuickAddAmount = (add: number) => {
    setAmount((prev) => {
      const cur = parseInt(prev.replace(/\D/g, ''), 10) || 0;
      return (cur + add).toString();
    });
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Catat Transaksi Baru
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tersimpan offline & siap disinkron ke Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Makanan & Minuman');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Gaji Pokok / Uang Bulanan');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nominal (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={numAmount > 0 ? numAmount.toLocaleString('id-ID') : amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmount(raw);
                }}
                placeholder="0"
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-xl font-black bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Quick Amount Add Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10000, 25000, 50000, 100000, 200000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  +{val >= 1000 ? `${val / 1000}rb` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Daily Limit Warning on Typing */}
          {type === 'expense' && willExceedDailyLimit && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan: Transaksi ini akan melebihi Limit Harian!</p>
                <p className="text-[11px] text-rose-600/90 dark:text-rose-400">
                  Total pengeluaran hari ini akan jadi Rp {projectedTodayExpense.toLocaleString('id-ID')} (Batas: Rp {Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}).
                </p>
              </div>
            </div>
          )}

          {type === 'expense' && willNearDailyLimit && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-2 text-amber-700 dark:text-amber-300 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold">Waspada: Mendekati Batas Limit Harian</p>
                <p className="text-[11px] text-amber-600/90 dark:text-amber-400">
                  Total pengeluaran hari ini akan mencapai {( (projectedTodayExpense / dailyStatus.dailyLimit) * 100 ).toFixed(0)}% dari limit.
                </p>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kategori *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {CATEGORY_ICON_MAP[cat.icon] || <ShoppingBag className="w-3.5 h-3.5" />}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description / Tempat Belanja */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keterangan / Tempat Belanja
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Belanja tempe & sayur di Pasar Antri Baru"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />

            {/* Quick tags for Cimahi */}
            <div className="flex flex-wrap gap-1 pt-1">
              {CIMAHI_QUICK_TAGS.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDescription(tag)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method & Date/Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="QRIS / E-Wallet">QRIS / GoPay / OVO / Dana</option>
                <option value="Tunai">Uang Tunai / Cash</option>
                <option value="Transfer Bank">Transfer Bank (BCA/Mandiri/BRI)</option>
                <option value="Kartu Debit">Kartu Debit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tanggal & Jam
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-2/3 px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-1/3 px-2 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={numAmount <= 0}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
