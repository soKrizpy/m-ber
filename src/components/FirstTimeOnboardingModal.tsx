import React, { useState } from 'react';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { MBerLogo } from './MBerLogo.tsx';

interface FirstTimeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (monthlyBudget: number) => void;
  onSkip: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => Promise<void>;
}

export const FirstTimeOnboardingModal: React.FC<FirstTimeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  googleUser,
  onGoogleSignIn,
}) => {
  const [amountStr, setAmountStr] = useState<string>('3500000');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format helper for Rupiah input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setAmountStr(rawVal);
    setErrorMsg(null);
  };

  const parsedAmount = parseInt(amountStr, 10) || 0;
  const estimatedDailyQuota = Math.round(parsedAmount / 30);

  const presets = [2000000, 3000000, 4500000, 6000000];

  const handleNextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedAmount <= 0) {
      setErrorMsg('Silakan masukkan nominal uang bulanan masuk (minimal Rp 100.000) atau klik tombol Lewati.');
      return;
    }
    onSubmit(parsedAmount);
  };

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      await onGoogleSignIn();
    } catch (err: any) {
      console.error('Onboarding Google Sign In failed:', err);
      setErrorMsg(err.message || 'Gagal masuk dengan Google. Anda tetap dapat melanjutkan atau melewati form.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Decorative Top Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200/80 dark:border-slate-700 flex items-center justify-center p-2 shadow-sm">
              <MBerLogo variant="icon" size={48} />
            </div>

            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Selamat Datang Pengguna Baru!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mulai Atur Anggaran M-Ber
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Tentukan target uang bulanan masuk agar sistem dapat membagi rata batas belanja harian Anda selama 30 hari.
              </p>
            </div>
          </div>

          {/* Form: Uang Bulanan Masuk */}
          <form onSubmit={handleNextSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label
                htmlFor="uang-bulanan-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                1. Masukkan Uang Bulanan Masuk
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400 select-none">
                  Rp
                </span>
                <input
                  id="uang-bulanan-input"
                  type="text"
                  inputMode="numeric"
                  value={parsedAmount > 0 ? parsedAmount.toLocaleString('id-ID') : ''}
                  onChange={handleAmountChange}
                  placeholder="Contoh: 3.500.000"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  autoFocus
                />
              </div>

              {/* Preset quick buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Pilihan Cepat:</span>
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmountStr(val.toString());
                      setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      parsedAmount === val
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Rp {(val / 1000000).toFixed(1).replace('.0', '')} Jt
                  </button>
                ))}
              </div>

              {/* Realtime estimated daily quota */}
              {parsedAmount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Batas Kuota Belanja Harian:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    ± Rp {estimatedDailyQuota.toLocaleString('id-ID')} / hari
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Google Account Login for Cloud Sheets Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Hubungkan Google Account (Opsional)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Google Sheets
                </span>
              </div>

              {googleUser ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="flex items-center space-x-2.5">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Google User"
                        className="w-8 h-8 rounded-full border border-emerald-400"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        {googleUser.displayName?.charAt(0) || 'G'}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">
                        {googleUser.displayName || 'Akun Google Terhubung'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {googleUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold space-x-1 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terhubung</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isSigningIn}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {/* Official Google 'G' icon */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isSigningIn ? 'Menghubungkan Google...' : 'Masuk dengan Akun Google'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    Hubungkan akun jika ingin mencadangkan transaksi ke spreadsheet Google Sheets Anda.
                  </p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons: NEXT vs SKIP */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <span>Lanjut ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onSkip}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                Lewati Form Ini (Gunakan Mode Lokal Saja)
              </button>
            </div>
          </form>

          {/* Privacy & Skip Explanation Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Privasi & Mode Offline:</strong>{' '}
              Jika Anda memilih <em>Lewati Form Ini</em>, data pencatatan Anda tetap tersimpan aman di perangkat ini dan <strong>tidak akan disimpan ke Google Sheets</strong>. Anda dapat menghubungkan Google Sheets kapan saja nanti di menu Pengaturan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
