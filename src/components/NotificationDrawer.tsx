import React from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { AppNotification, NotificationService } from '../services/notifications.ts';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onMarkRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkRead,
}) => {
  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      NotificationService.push(
        'Notifikasi Push Aktif!',
        'Anda akan menerima peringatan otomatis saat pengeluaran mendekati atau melebihi limit harian.',
        'success'
      );
    }
  };

  const hasPushPermission =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Peringatan & Notifikasi
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Limit harian & pembaruan sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Push Permission Banner */}
        {!hasPushPermission && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-2">
            <p className="font-bold text-emerald-900 dark:text-emerald-200">
              Aktifkan Push Notifikasi Seluler
            </p>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300">
              Dapatkan peringatan seketika saat belanja harian Anda di Cimahi mendekati batas kuota agar uang cukup sebulan.
            </p>
            <button
              onClick={handleEnablePush}
              className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
            >
              Izinkan Notifikasi Push
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {notifications.length} Catatan Notifikasi
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onMarkRead}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 font-medium"
            >
              Tandai Dibaca
            </button>
            <span>•</span>
            <button
              onClick={onClearAll}
              className="text-rose-500 hover:text-rose-600 font-medium flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-xs font-medium">Tidak ada notifikasi saat ini.</p>
              <p className="text-[11px]">Pengeluaran dan kondisi anggaran Anda masih terpantau aman.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition text-xs space-y-1 ${
                  n.type === 'alert'
                    ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60'
                    : n.type === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold">
                    {n.type === 'alert' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    ) : n.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                    <span
                      className={
                        n.type === 'alert'
                          ? 'text-rose-900 dark:text-rose-200'
                          : n.type === 'warning'
                          ? 'text-amber-900 dark:text-amber-200'
                          : 'text-slate-900 dark:text-white'
                      }
                    >
                      {n.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {n.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
