/**
 * Rewarded Ads Service for M-Ber (Dompet Pintar Ibu)
 * Mengelola tiket Rapor Belanja Bunda 24 Jam, kuota agenda Google Calendar,
 * slot Tabungan Impian, dan ekspor laporan PDF HD tanpa watermark.
 */

export type RewardType =
  | 'compliance_pass' // Rapor Belanja Bunda 24 Jam
  | 'calendar_sync'   // Kuota Pengingat Kalender
  | 'pdf_hd_export'   // Unduh Laporan PDF Rapi HD Bersih
  | 'savings_slot';   // Buka Slot Tabungan Impian Baru

export interface RewardStatus {
  complianceExpiresAt: number | null; // timestamp ms
  calendarPasses: number;
  savingsSlots: number;
  pdfHdPasses: number;
  totalAdsWatched: number;
  lastAdWatchedAt: number | null;
}

const STORAGE_KEY = 'mber_rewarded_ads_status';

// Default initial state untuk ibu-ibu:
// Diberikan 1 kuota kalender gratis, 1 slot tabungan impian awal, dan 1 tiket PDF HD gratis
const defaultStatus: RewardStatus = {
  complianceExpiresAt: null,
  calendarPasses: 1,
  savingsSlots: 1,
  pdfHdPasses: 1,
  totalAdsWatched: 0,
  lastAdWatchedAt: null,
};

export class RewardedAdsService {
  private static getStatus(): RewardStatus {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultStatus };
      const parsed = JSON.parse(raw);
      return {
        complianceExpiresAt: parsed.complianceExpiresAt || null,
        calendarPasses: typeof parsed.calendarPasses === 'number' ? parsed.calendarPasses : 1,
        savingsSlots: typeof parsed.savingsSlots === 'number' ? parsed.savingsSlots : 1,
        pdfHdPasses: typeof parsed.pdfHdPasses === 'number' ? parsed.pdfHdPasses : 1,
        totalAdsWatched: parsed.totalAdsWatched || 0,
        lastAdWatchedAt: parsed.lastAdWatchedAt || null,
      };
    } catch {
      return { ...defaultStatus };
    }
  }

  private static saveStatus(status: RewardStatus): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      // Dispatch event agar seluruh UI aplikasi langsung terupdate
      window.dispatchEvent(new CustomEvent('mber_rewards_updated', { detail: status }));
    } catch (e) {
      console.warn('Gagal menyimpan status reward ads:', e);
    }
  }

  /**
   * Cek apakah Bunda memiliki tiket aktif Rapor Belanja Bunda (24 jam)
   */
  public static hasActiveCompliancePass(): boolean {
    const status = this.getStatus();
    if (!status.complianceExpiresAt) return false;
    return Date.now() < status.complianceExpiresAt;
  }

  /**
   * Sisa waktu aktif tiket Rapor Belanja Bunda
   */
  public static getCompliancePassRemainingTime(): string {
    const status = this.getStatus();
    if (!status.complianceExpiresAt) return 'Belum Aktif';
    const diffMs = status.complianceExpiresAt - Date.now();
    if (diffMs <= 0) return 'Perlu Diperpanjang';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit`;
  }

  /**
   * Berikan akses Rapor Belanja Bunda 24 jam setelah menonton video singkat
   */
  public static grantCompliancePass(durationHours = 24): void {
    const status = this.getStatus();
    const now = Date.now();
    const currentExpiry =
      status.complianceExpiresAt && status.complianceExpiresAt > now
        ? status.complianceExpiresAt
        : now;

    status.complianceExpiresAt = currentExpiry + durationHours * 60 * 60 * 1000;
    status.totalAdsWatched += 1;
    status.lastAdWatchedAt = now;
    this.saveStatus(status);
  }

  /**
   * Jumlah slot jadwal pengingat Google Calendar tersedia
   */
  public static getCalendarPassCount(): number {
    const status = this.getStatus();
    return Math.max(0, status.calendarPasses);
  }

  public static grantCalendarPass(amount = 2): void {
    const status = this.getStatus();
    status.calendarPasses += amount;
    status.totalAdsWatched += 1;
    status.lastAdWatchedAt = Date.now();
    this.saveStatus(status);
  }

  public static consumeCalendarPass(): boolean {
    const status = this.getStatus();
    if (status.calendarPasses > 0) {
      status.calendarPasses -= 1;
      this.saveStatus(status);
      return true;
    }
    return false;
  }

  /**
   * Slot target Tabungan Impian (Multi-Goals)
   */
  public static getSavingsSlotsCount(): number {
    const status = this.getStatus();
    return Math.max(1, status.savingsSlots);
  }

  public static grantSavingsSlot(amount = 1): void {
    const status = this.getStatus();
    status.savingsSlots += amount;
    status.totalAdsWatched += 1;
    status.lastAdWatchedAt = Date.now();
    this.saveStatus(status);
  }

  /**
   * Tiket Ekspor Laporan PDF HD Tanpa Watermark
   */
  public static getPdfHdPassCount(): number {
    const status = this.getStatus();
    return Math.max(0, status.pdfHdPasses);
  }

  public static grantPdfHdPass(amount = 2): void {
    const status = this.getStatus();
    status.pdfHdPasses += amount;
    status.totalAdsWatched += 1;
    status.lastAdWatchedAt = Date.now();
    this.saveStatus(status);
  }

  public static consumePdfHdPass(): boolean {
    const status = this.getStatus();
    if (status.pdfHdPasses > 0) {
      status.pdfHdPasses -= 1;
      this.saveStatus(status);
      return true;
    }
    return false;
  }

  public static getTotalAdsWatched(): number {
    return this.getStatus().totalAdsWatched;
  }

  /**
   * Deteksi jembatan Google AdMob Android Native (jika dijalankan dalam APK / TWA)
   */
  public static isNativeAndroidBridgeAvailable(): boolean {
    return typeof (window as any).AndroidAdMob !== 'undefined';
  }

  public static requestNativeRewardedAd(rewardType: RewardType): Promise<boolean> | null {
    if (this.isNativeAndroidBridgeAvailable()) {
      return new Promise((resolve) => {
        try {
          (window as any)._onAdMobReward = (success: boolean) => {
            if (success) {
              if (rewardType === 'compliance_pass') this.grantCompliancePass();
              if (rewardType === 'calendar_sync') this.grantCalendarPass();
              if (rewardType === 'pdf_hd_export') this.grantPdfHdPass();
              if (rewardType === 'savings_slot') this.grantSavingsSlot();
            }
            resolve(success);
          };
          (window as any).AndroidAdMob.showRewardedAd(rewardType);
        } catch {
          resolve(false);
        }
      });
    }
    return null;
  }
}
