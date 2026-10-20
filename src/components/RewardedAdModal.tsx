import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Gift,
  CheckCircle2,
  Award,
  Calendar,
  FileDown,
  Target,
} from 'lucide-react';
import { RewardedAdsService, RewardType } from '../services/rewardedAds.ts';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardType: RewardType;
  onRewardGranted: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  rewardType,
  onRewardGranted,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  // Play a soft pleasant chime on reward unlocked
  const playRewardChime = () => {
    try {
      if (isMuted) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // AudioContext may be restricted by autoplay policy
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setIsCompleted(false);
      setHasClaimed(false);
      return;
    }

    // Check if native Android bridge handles this
    const nativePromise = RewardedAdsService.requestNativeRewardedAd(rewardType);
    if (nativePromise) {
      nativePromise.then((success) => {
        if (success) {
          onRewardGranted();
          onClose();
        }
      });
      return;
    }

    // Default Web simulation timer (5 seconds)
    setSecondsRemaining(5);
    setIsCompleted(false);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          playRewardChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, rewardType]);

  if (!isOpen) return null;

  const handleClaimReward = () => {
    if (!isCompleted || hasClaimed) return;
    setHasClaimed(true);

    if (rewardType === 'compliance_pass') {
      RewardedAdsService.grantCompliancePass(24);
    } else if (rewardType === 'calendar_sync') {
      RewardedAdsService.grantCalendarPass(2);
    } else if (rewardType === 'pdf_hd_export') {
      RewardedAdsService.grantPdfHdPass(2);
    } else if (rewardType === 'savings_slot') {
      RewardedAdsService.grantSavingsSlot(1);
    }

    onRewardGranted();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const getRewardInfo = () => {
    switch (rewardType) {
      case 'compliance_pass':
        return {
          title: 'Akses 24 Jam Rapor Belanja Bunda',
          desc: 'Buka semua evaluasi & lencana hemat keluarga',
          icon: <Award className="w-6 h-6 text-amber-400" />,
        };
      case 'calendar_sync':
        return {
          title: '2 Kuota Pengingat Jadwal Kalender',
          desc: 'Pasang alarm evaluasi belanja & bayar tagihan',
          icon: <Calendar className="w-6 h-6 text-blue-400" />,
        };
      case 'pdf_hd_export':
        return {
          title: '2 Kuota Unduh PDF Rapi Bersih (Tanpa Cap)',
          desc: 'Laporan keuangan bulanan kualitas cetak HD',
          icon: <FileDown className="w-6 h-6 text-emerald-400" />,
        };
      case 'savings_slot':
        return {
          title: '1 Slot Tambahan Tabungan Impian',
          desc: 'Bisa catat target baru: anak, arisan, kurban, dll',
          icon: <Target className="w-6 h-6 text-rose-400" />,
        };
      default:
        return {
          title: 'Hadiah Spesial Bunda',
          desc: 'Fitur ekstra gratis di M-Ber',
          icon: <Gift className="w-6 h-6 text-amber-400" />,
        };
    }
  };

  const reward = getRewardInfo();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Gift className="w-3 h-3 text-amber-400" />
              Video Hadiah Sponsor
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
              title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {isCompleted ? (
              <button
                onClick={handleClaimReward}
                className="p-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white transition cursor-pointer"
                title="Tutup & Klaim Hadiah"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-300">
                <span>Hadiah dalam {secondsRemaining}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Video / Creative Simulation Frame */}
        <div className="relative aspect-16/10 bg-gradient-to-br from-slate-800 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.25),transparent_70%)]" />

          <div className="relative z-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-xl">
              {reward.icon}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-emerald-300 tracking-wide uppercase">
                Mitra Belanja Hemat Ibu Indonesia
              </span>
              <h4 className="text-base sm:text-lg font-black tracking-tight text-white px-4">
                Atur Uang Belanja Tenang, Rezeki Keluarga Berkah
              </h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Terima kasih Bunda telah mendukung aplikasi M-Ber dengan menonton tayangan sponsor ini.
              </p>
            </div>
          </div>

          {/* Progress Bar at bottom of media */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom Reward Claim Section */}
        <div className="p-4 sm:p-5 bg-slate-950 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 border border-slate-800/80 rounded-2xl p-3 bg-slate-900/60">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-xs">{reward.title}</p>
                <p className="text-[10px] text-slate-400">{reward.desc}</p>
              </div>
            </div>

            {isCompleted ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Siap
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-400">
                {secondsRemaining}s lagi
              </span>
            )}
          </div>

          <button
            onClick={handleClaimReward}
            disabled={!isCompleted}
            className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 active:scale-98 shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
            }`}
          >
            {isCompleted ? (
              <>
                <Gift className="w-4 h-4" />
                <span>Klaim Hadiah Bunda & Lanjutkan</span>
              </>
            ) : (
              <span>Menonton Video Sponsor ({secondsRemaining}s)...</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
