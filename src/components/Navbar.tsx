import React from 'react';
import {
  Wallet,
  Wifi,
  WifiOff,
  CloudUpload,
  Moon,
  Sun,
  Bell,
  FileSpreadsheet,
  Calendar,
  Settings,
} from 'lucide-react';
import { SyncStatus } from '../types/finance.ts';
import { User } from 'firebase/auth';

interface NavbarProps {
  isDark: boolean;
  onToggleDark: () => void;
  syncStatus: SyncStatus;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenSyncModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenSettingsModal: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleLogout: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleDark,
  syncStatus,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenSyncModal,
  onOpenCalendarModal,
  onOpenSettingsModal,
  googleUser,
  onGoogleSignIn,
  onGoogleLogout,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Region Badge (Icon-only on smaller screens) */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
            onClick={onNavigateHome}
            title="Kembali ke Ringkasan"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  M-Ber
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                  Cimahi & KBB
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Monthly Budget Report
              </p>
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center space-x-2">
            {/* Online / Offline status (Icon only on smaller screens) */}
            <div
              className={`flex items-center space-x-1 p-2 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                syncStatus.isOnline
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
              title={syncStatus.isOnline ? 'Terhubung online' : 'Mode offline aktif (data tersimpan di lokal)'}
            >
              {syncStatus.isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden md:inline">
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Pending queue badge */}
            {syncStatus.pendingCount > 0 && (
              <button
                onClick={onOpenSyncModal}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 hover:bg-blue-200 transition"
                title={`${syncStatus.pendingCount} transaksi belum tersinkron ke Google Sheets`}
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{syncStatus.pendingCount}</span>
              </button>
            )}

            {/* Google Sheets Modal trigger */}
            <button
              onClick={onOpenSyncModal}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Koneksi Google Sheets & Apps Script"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>

            {/* Google Calendar modal trigger */}
            <button
              onClick={onOpenCalendarModal}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Pengingat Jadwal Google Calendar"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Notifikasi & Peringatan Limit"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Settings Modal Trigger */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Pengaturan & Aturan Kategori"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Google User Profile or Login */}
            {googleUser ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google'}
                    className="w-7 h-7 rounded-full ring-2 ring-emerald-500"
                    title={googleUser.email || ''}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {(googleUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onGoogleLogout}
                  className="text-[11px] font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 hidden xl:inline"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition flex items-center space-x-1.5"
                title="Masuk dengan Akun Google"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">Masuk Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
