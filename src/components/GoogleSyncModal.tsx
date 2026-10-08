import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CloudUpload,
  ExternalLink,
  Code2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { SyncStatus, Transaction, BudgetConfig } from '../types/finance.ts';
import { GoogleSheetsService } from '../services/googleSheets.ts';
import { User } from 'firebase/auth';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  transactions: Transaction[];
  budgetConfig: BudgetConfig;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleLogout: () => void;
  onSyncSuccess: (message: string) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  transactions,
  budgetConfig,
  googleUser,
  onGoogleSignIn,
  onGoogleLogout,
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'gas'>('oauth');
  const [gasUrlInput, setGasUrlInput] = useState(syncStatus.gasWebAppUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Direct OAuth Sync
  const handleSyncOAuth = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const res = await GoogleSheetsService.syncDirectOAuth(
        transactions,
        budgetConfig,
        syncStatus.sheetsSpreadsheetId
      );
      onSyncSuccess(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyinkronkan data ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Apps Script Sync
  const handleSyncGAS = async () => {
    if (!gasUrlInput.trim()) {
      setErrorMessage('Harap masukkan URL Web App Google Apps Script.');
      return;
    }
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const res = await GoogleSheetsService.syncViaAppsScript(
        gasUrlInput.trim(),
        transactions,
        budgetConfig
      );
      onSyncSuccess(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyinkronkan data melalui Google Apps Script.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = () => {
    const code = GoogleSheetsService.getAppsScriptCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sinkronisasi Google Sheets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan data cloud real-time & backup otomatis
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

        {/* Tab Switcher: Direct OAuth vs GAS Web App */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'oauth'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Google Sheets Langsung (OAuth)
          </button>
          <button
            onClick={() => setActiveTab('gas')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'gas'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Google Apps Script (Web Hosting)
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Direct OAuth */}
        {activeTab === 'oauth' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Status Akun Google:
                </span>
                {googleUser ? (
                  <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terhubung ({googleUser.email})</span>
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Belum Masuk</span>
                )}
              </div>

              {!googleUser ? (
                <div>
                  <button
                    onClick={onGoogleSignIn}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-50 transition shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Masuk dengan Google</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                    Izin Google Sheets diperlukan untuk membaca & menulis data pencatatan Anda.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Ingin beralih akun Google?
                  </span>
                  <button
                    onClick={onGoogleLogout}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 underline"
                  >
                    Keluar dari Akun
                  </button>
                </div>
              )}
            </div>

            {/* Spreadsheet target status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Dokumen Google Sheets:
                </span>
                {syncStatus.sheetsSpreadsheetUrl ? (
                  <a
                    href={syncStatus.sheetsSpreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <span>Buka Dokumen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400">Belum dibuat (Otomatis dibuat saat sinkron)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sistem akan membuat sheet <code>Pencatatan_Transaksi</code> dan <code>Ringkasan_Anggaran</code> lengkap dengan format rapi.
              </p>
            </div>

            {/* Sync trigger button */}
            <button
              onClick={handleSyncOAuth}
              disabled={isSyncing || !googleUser}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Menyinkronkan ke Google Sheets...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Sinkronkan Sekarang ke Google Sheets ({transactions.length} Data)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: Google Apps Script Web App */}
        {activeTab === 'gas' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 flex items-start space-x-2.5">
              <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Dukungan Web Hosting Gratis (Git / itch.io / Static Host)</p>
                <p className="text-[11px] leading-relaxed">
                  Jika Anda men-deploy web ini di Git Pages, itch.io, atau web gratis lainnya tanpa OAuth, Anda dapat menggunakan <strong>Google Apps Script sebagai backend API</strong> untuk menyimpan seluruh transaksi ke Google Sheets secara cuma-cuma.
                </p>
              </div>
            </div>

            {/* Step instructions */}
            <div className="space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Langkah Mudah Pengaturan Google Apps Script:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pl-1">
                <li>Buka Google Sheets baru di <code>sheets.new</code>.</li>
                <li>Pilih menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                <li>Salin kode script di bawah ini lalu tempel (paste) ke editor.</li>
                <li>Klik <strong>Deploy &gt; New Deployment &gt; Web App</strong> (Jalankan sebagai: 'Saya', Akses: 'Siapa saja').</li>
                <li>Salin URL Web App yang dihasilkan ke kolom input di bawah.</li>
              </ol>
            </div>

            {/* Copy Script Code Button */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  Backend Code.gs (Siap Pakai)
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-white transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Kode Tersalin!' : 'Salin Script'}</span>
              </button>
            </div>

            {/* Input GAS Web App URL */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                URL Aplikasi Web Google Apps Script (doPost Endpoint):
              </label>
              <input
                type="url"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* GAS Sync Button */}
            <button
              onClick={handleSyncGAS}
              disabled={isSyncing}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Data ke Google Apps Script...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Sinkronkan via Google Apps Script ({transactions.length} Data)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Sync Log Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Riwayat Aktivitas Sinkronisasi Terakhir:
          </p>
          <div className="max-h-24 overflow-y-auto space-y-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
            {syncStatus.syncLog && syncStatus.syncLog.length > 0 ? (
              syncStatus.syncLog.map((log, idx) => <p key={idx}>{log}</p>)
            ) : (
              <p>Belum ada aktivitas sinkronisasi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
