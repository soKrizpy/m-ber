import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  PiggyBank,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';
import { SavingsGoal } from '../types/finance.ts';

interface SavingsGoalsSectionProps {
  savingsGoals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
  unusedBudgetSurplus: number; // calculated from Math.max(0, monthlyBudget - totalExpense)
  monthlyBudget: number;
}

const CATEGORY_OPTIONS = [
  { label: 'Dana Darurat', icon: '🛡️', color: 'from-amber-500 to-orange-500' },
  { label: 'Liburan & Healing', icon: '🏖️', color: 'from-teal-500 to-emerald-500' },
  { label: 'Gadget & Elektronik', icon: '💻', color: 'from-blue-500 to-indigo-500' },
  { label: 'Kendaraan & Servis', icon: '🛵', color: 'from-purple-500 to-violet-500' },
  { label: 'Pendidikan & Kursus', icon: '🎓', color: 'from-cyan-500 to-blue-500' },
  { label: 'Investasi & Masa Depan', icon: '📈', color: 'from-emerald-500 to-teal-500' },
  { label: 'Renovasi Rumah', icon: '🏡', color: 'from-amber-600 to-yellow-600' },
  { label: 'Lainnya', icon: '✨', color: 'from-slate-500 to-gray-600' },
];

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  savingsGoals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  unusedBudgetSurplus,
  monthlyBudget,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORY_OPTIONS[0].label);
  const [formInitialSaved, setFormInitialSaved] = useState('');
  const [formSurplusPct, setFormSurplusPct] = useState(100);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormTargetAmount('');
    // Default 3 months ahead
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setFormTargetDate(d.toISOString().split('T')[0]);
    setFormCategory(CATEGORY_OPTIONS[0].label);
    setFormInitialSaved('0');
    setFormSurplusPct(100);
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormTargetAmount(goal.targetAmount.toString());
    setFormTargetDate(goal.targetDate);
    setFormCategory(goal.category || CATEGORY_OPTIONS[0].label);
    setFormInitialSaved((goal.initialSavedAmount || 0).toString());
    setFormSurplusPct(goal.surplusAllocationPct ?? 100);
    setFormNotes(goal.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Silakan masukkan nama target tabungan.');
      return;
    }

    const cleanTargetAmount = parseInt(formTargetAmount.replace(/\D/g, ''), 10);
    if (isNaN(cleanTargetAmount) || cleanTargetAmount <= 0) {
      setFormError('Jumlah target tabungan harus lebih dari Rp 0.');
      return;
    }

    if (!formTargetDate) {
      setFormError('Silakan tentukan tanggal target tabungan.');
      return;
    }

    const cleanInitial = parseInt(formInitialSaved.replace(/\D/g, ''), 10) || 0;

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        title: formTitle.trim(),
        targetAmount: cleanTargetAmount,
        targetDate: formTargetDate,
        category: formCategory,
        initialSavedAmount: cleanInitial,
        surplusAllocationPct: formSurplusPct,
        notes: formNotes.trim(),
      });
    } else {
      onAddGoal({
        title: formTitle.trim(),
        targetAmount: cleanTargetAmount,
        targetDate: formTargetDate,
        category: formCategory,
        initialSavedAmount: cleanInitial,
        surplusAllocationPct: formSurplusPct,
        notes: formNotes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Calculate days remaining helper
  const getDaysRemaining = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header with Title and Surplus Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xs">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Target Tabungan (Savings Goals)
                </h3>
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Surplus-Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencapaian target otomatis terdorong oleh sisa surplus anggaran bulanan Cimahi & KBB.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          {/* Unused Surplus Pill */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center space-x-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                Surplus Belum Terpakai
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(unusedBudgetSurplus)}
              </span>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Target</span>
          </button>
        </div>
      </div>

      {/* Surplus Explanation Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-cyan-50/70 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Sisa kuota anggaran bulan ini dialokasikan langsung ke target tabungan Anda.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Makin hemat pengeluaran di Cimahi & KBB, makin cepat target tabungan Anda tercapai!
            </p>
          </div>
        </div>
        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 shrink-0 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
          Total Target Aktif: <strong>{savingsGoals.length} Target</strong>
        </div>
      </div>

      {/* Goals List */}
      {savingsGoals.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum ada Target Tabungan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Buat target pertama Anda (seperti Dana Darurat, Liburan, atau Pembelian Impian) dan pantau perkembangannya dengan surplus anggaran.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Target Pertama Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const daysLeft = getDaysRemaining(goal.targetDate);
            const allocationFactor = (goal.surplusAllocationPct ?? 100) / 100;
            const surplusContribution = Math.round(unusedBudgetSurplus * allocationFactor);
            const initialBase = goal.initialSavedAmount || 0;
            const totalAccumulated = initialBase + surplusContribution;
            const percentage = Math.min(
              100,
              Math.max(0, Math.round((totalAccumulated / (goal.targetAmount || 1)) * 100))
            );
            const remainingNeeded = Math.max(0, goal.targetAmount - totalAccumulated);
            const isCompleted = percentage >= 100;

            // Required daily saving pace to hit goal on time
            const dailyPaceNeeded =
              daysLeft > 0 ? Math.ceil(remainingNeeded / daysLeft) : remainingNeeded;

            const matchedCat = CATEGORY_OPTIONS.find((c) => c.label === goal.category);

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Category icon, Title, Actions */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl shrink-0" role="img" aria-label="icon">
                        {matchedCat ? matchedCat.icon : '🎯'}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {goal.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {goal.category}
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Tercapai!</span>
                            </span>
                          ) : daysLeft <= 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Lewat Target
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{daysLeft} hari lagi</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Ubah Target"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus target "${goal.title}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {goal.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                      &quot;{goal.notes}&quot;
                    </p>
                  )}

                  {/* Target Amount vs Current Accumulated */}
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Terkumpul Saat Ini
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {formatRupiah(totalAccumulated)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Target Dana
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {formatRupiah(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                        <span>Progres Tabungan</span>
                      </span>
                      <span
                        className={`${
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : percentage >= 70
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {/* Gradient Bar */}
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400'
                            : percentage >= 70
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                            : percentage >= 40
                            ? 'bg-gradient-to-r from-amber-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />

                      {/* Milestone tick marks at 25%, 50%, 75% */}
                      <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-white/40 dark:bg-slate-900/40 pointer-events-none" />
                      <div className="absolute top-0 bottom-0 left-2/4 w-0.5 bg-white/40 dark:bg-slate-900/40 pointer-events-none" />
                      <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-white/40 dark:bg-slate-900/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Surplus vs Initial breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="bg-white/80 dark:bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Dari Surplus Anggaran:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(surplusContribution)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        ({goal.surplusAllocationPct ?? 100}% alokasi sisa kuota)
                      </span>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Target Tanggal:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatDateIndo(goal.targetDate)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Target tercapai/habis'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Projection Pace */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  {!isCompleted && daysLeft > 0 ? (
                    <>
                      <span className="text-slate-500 dark:text-slate-400">
                        Sisa kekurangan: <strong>{formatRupiah(remainingNeeded)}</strong>
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        Pace: ~{formatRupiah(dailyPaceNeeded)}/hari
                      </span>
                    </>
                  ) : isCompleted ? (
                    <div className="w-full flex items-center justify-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold py-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Target tabungan ini berhasil tercapai! 🎉</span>
                    </div>
                  ) : (
                    <span className="text-rose-500 dark:text-rose-400">
                      Tanggal target telah lewat. Pertimbangkan perbarui tanggal target.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Tambah / Edit Target Tabungan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingGoal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Target Tabungan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dana Darurat, Liburan Lembang, Beli Motor"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.label} value={cat.label}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Amount */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Target Tabungan (Rp) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="5000000"
                  value={formTargetAmount}
                  onChange={(e) => {
                    const num = e.target.value.replace(/\D/g, '');
                    setFormTargetAmount(num);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {formTargetAmount && !isNaN(parseInt(formTargetAmount, 10)) && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                    {formatRupiah(parseInt(formTargetAmount, 10))}
                  </p>
                )}
              </div>

              {/* Target Date */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Tanggal Tercapai *
                </label>
                <input
                  type="date"
                  required
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Initial Saved Amount */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tabungan Awal yang Sudah Ada (Rp, opsional)
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={formInitialSaved}
                  onChange={(e) => {
                    const num = e.target.value.replace(/\D/g, '');
                    setFormInitialSaved(num);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Surplus Allocation Percentage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Alokasi Surplus Anggaran Bulanan
                  </label>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formSurplusPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={formSurplusPct}
                  onChange={(e) => setFormSurplusPct(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Porsi sisa kuota bulanan ({formatRupiah(unusedBudgetSurplus)}) yang otomatis dihitung mempercepat target ini:{' '}
                  <strong>{formatRupiah((unusedBudgetSurplus * formSurplusPct) / 100)}</strong>
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Motivasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Untuk persiapan mudik / biaya sekolah anak"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingGoal ? 'Simpan Perubahan' : 'Buat Target'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
