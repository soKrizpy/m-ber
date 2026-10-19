import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Gift,
  Sparkles,
} from 'lucide-react';
import { GoogleCalendarService } from '../services/googleCalendar.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { RewardedAdsService } from '../services/rewardedAds.ts';
import { RewardedAdModal } from './RewardedAdModal.tsx';
import { User } from 'firebase/auth';

interface CalendarReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onSuccess: (message: string) => void;
}

export const CalendarReminderModal: React.FC<CalendarReminderModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  onGoogleSignIn,
  onSuccess,
}) => {
  const [summary, setSummary] = useState('Cek Sisa Uang Belanja Mingguan');
  const [description, setDescription] = useState(
    'Cek sisa uang belanja dapur dan jatah harian di M-Ber biar keuangan keluarga aman dan nggak boncos.'
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createdEventLink, setCreatedEventLink] = useState<string | null>(null);

  // Rewarded ads state
  const [calendarPasses, setCalendarPasses] = useState(() =>
    RewardedAdsService.getCalendarPassCount()
  );
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [pendingEventAfterAd, setPendingEventAfterAd] = useState(false);

  useEffect(() => {
    const updatePasses = () => {
      setCalendarPasses(RewardedAdsService.getCalendarPassCount());
    };
    updatePasses();
    window.addEventListener('mber_rewards_updated', updatePasses);
    return () => window.removeEventListener('mber_rewards_updated', updatePasses);
  }, []);

  if (!isOpen) return null;

  const handleTriggerAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !date) return;

    // Check if user has available calendar pass
    if (calendarPasses <= 0) {
      setPendingEventAfterAd(true);
      setIsAdModalOpen(true);
      return;
    }

    setShowConfirm(true);
  };

  const executeAddCalendarEvent = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await GoogleCalendarService.createBudgetReminderEvent({
        summary: summary.trim(),
        description: description.trim(),
        startDate: date,
        startTime: time,
      });

      // Consume one pass
      RewardedAdsService.consumeCalendarPass();
      setCreatedEventLink(res.htmlLink);
      onSuccess(`Berhasil menambahkan jadwal pengingat ke Google Calendar: "${summary}"`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menambahkan jadwal pengingat ke Google Calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewardGranted = () => {
    setCalendarPasses(RewardedAdsService.getCalendarPassCount());
    if (pendingEventAfterAd) {
      setPendingEventAfterAd(false);
      // Auto open confirmation now that pass is granted
      setTimeout(() => {
        setShowConfirm(true);
      }, 300);
    }
  };

  const PRESET_EVENTS = [
    {
      title: 'Evaluasi Belanja Mingguan Bunda',
      desc: 'Cek sisa uang belanja & pastikan dapur tetap ngebul aman',
      time: '09:00',
    },
    {
      title: 'Jadwal Belanja Sembako & Sayur Pasar Hemat',
      desc: 'Beli beras, telur, tahu/tempe, dan sayuran segar hemat di pasar',
      time: '06:30',
    },
    {
      title: 'Bayar Listrik PLN, Air, & Tagihan Rutin',
      desc: 'Bayar token PLN, iuran warga, dan paket data sebelum jatuh tempo',
      time: '10:00',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Alarm & Jadwal Kalender Bunda
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Pasang pengingat belanja pasar hemat & bayar tagihan
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

          {/* Rewarded Ads Pass Banner */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Kuota Kalender: <strong>{calendarPasses} jadwal tersedia</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPendingEventAfterAd(false);
                setIsAdModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[10px] transition cursor-pointer"
            >
              + Tambah 2 Jadwal (Video 5s)
            </button>
          </div>

          {!googleUser ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Untuk menyinkronkan pengingat ke kalender Anda, silakan masuk dengan akun Google terlebih dahulu.
              </p>
              <button
                onClick={onGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-md transition"
              >
                Masuk dengan Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleTriggerAdd} className="space-y-3.5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {createdEventLink && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Jadwal tersimpan di kalender!</span>
                  </span>
                  <a
                    href={createdEventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <span>Lihat di Kalender</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Preset Chips */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Pilihan Cepat Agenda:
                </label>
                <div className="flex flex-col gap-1.5">
                  {PRESET_EVENTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSummary(preset.title);
                        setDescription(preset.desc);
                        setTime(preset.time);
                      }}
                      className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500 text-left transition text-xs space-y-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs">
                        {preset.title}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        {preset.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Judul Agenda *
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jam
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer ${
                    calendarPasses <= 0
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : calendarPasses <= 0 ? (
                    <>
                      <Gift className="w-3.5 h-3.5 text-amber-200" />
                      <span>Tonton Iklan & Simpan</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Simpan ke Kalender</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        title="Tambahkan Agenda ke Google Calendar?"
        message={`Apakah Anda mengizinkan penambahan jadwal pengingat "${summary}" pada ${date} pukul ${time} ke Google Calendar utama Anda (menggunakan 1 kuota kalender)?`}
        confirmLabel="Ya, Tambahkan ke Kalender"
        cancelLabel="Batal"
        isDestructive={false}
        onConfirm={executeAddCalendarEvent}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        rewardType="calendar_sync"
        onRewardGranted={handleRewardGranted}
      />
    </>
  );
};
