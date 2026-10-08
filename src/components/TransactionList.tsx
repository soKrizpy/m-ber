import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types/finance.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Extract unique categories from current list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [transactions]);

  // Filter & Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = selectedType === 'all' || t.type === selectedType;
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.paymentMethod.toLowerCase().includes(searchLower);

      return matchType && matchCategory && matchSearch;
    });
  }, [transactions, selectedType, selectedCategory, searchTerm]);

  // Target item to delete
  const targetItem = transactions.find((t) => t.id === deleteTargetId);

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Riwayat Pencatatan Keuangan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total {filteredTransactions.length} transaksi ditampilkan
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Catatan</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi, pasar, atau keterangan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Type filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Jenis</option>
              <option value="expense">Pengeluaran Saja</option>
              <option value="income">Pemasukan Saja</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Filter className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada transaksi yang sesuai
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Ubah filter pencarian atau klik tombol Tambah Catatan untuk memasukkan data baru.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Transaksi Baru</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition gap-3"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'expense'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {tx.type === 'expense' ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      {tx.time && <span>{tx.time}</span>}
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                        {tx.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Sync Status & Delete */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs sm:text-sm font-extrabold ${
                        tx.type === 'expense'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {tx.type === 'expense' ? '-' : '+'} Rp {tx.amount.toLocaleString('id-ID')}
                    </p>

                    <div className="flex items-center justify-end space-x-1 mt-0.5">
                      {tx.isSynced ? (
                        <span
                          className="inline-flex items-center space-x-0.5 text-[10px] text-emerald-600 dark:text-emerald-400"
                          title="Tersinkronisasi dengan Google Sheets"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden xs:inline">Sheets</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center space-x-0.5 text-[10px] text-blue-500"
                          title="Tersimpan di offline storage, menunggu sinkronisasi"
                        >
                          <Clock className="w-3 h-3" />
                          <span className="hidden xs:inline">Lokal</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteTargetId(tx.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Hapus transaksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for deletion */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="Hapus Catatan Transaksi?"
        message={`Apakah Anda yakin ingin menghapus catatan "${targetItem?.description || 'transaksi ini'}" sebesar Rp ${targetItem?.amount.toLocaleString('id-ID')}? Tindakan ini akan menghapus data dan memperbarui sinkronisasi.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
