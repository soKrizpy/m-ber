import { CategoryNotificationRule, Transaction } from '../types/finance.ts';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'warning' | 'alert' | 'info' | 'success';
  timestamp: number;
  isRead: boolean;
}

const STORAGE_NOTIFS = 'catatcuan_notifications_v1';
const STORAGE_CATEGORY_RULES = 'catatcuan_category_rules_v1';

const INITIAL_CATEGORY_RULES: CategoryNotificationRule[] = [
  {
    id: 'rule-ent-1',
    category: 'Hiburan & Santai',
    thresholdAmount: 500000,
    period: 'monthly',
    isEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'rule-food-1',
    category: 'Makanan & Minuman',
    thresholdAmount: 1200000,
    period: 'monthly',
    isEnabled: true,
    createdAt: Date.now(),
  },
];

export class NotificationService {
  static getCategoryRules(): CategoryNotificationRule[] {
    try {
      const data = localStorage.getItem(STORAGE_CATEGORY_RULES);
      if (!data) {
        this.saveCategoryRules(INITIAL_CATEGORY_RULES);
        return INITIAL_CATEGORY_RULES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CATEGORY_RULES;
    }
  }

  static saveCategoryRules(rules: CategoryNotificationRule[]) {
    localStorage.setItem(STORAGE_CATEGORY_RULES, JSON.stringify(rules));
    window.dispatchEvent(new Event('category_rules_updated'));
  }

  static getInAppNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_NOTIFS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveInAppNotifications(notifs: AppNotification[]) {
    localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(notifs.slice(0, 30)));
    window.dispatchEvent(new Event('app_notifications_updated'));
  }

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser tidak mendukung Web Notifications.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const status = await Notification.requestPermission();
      return status === 'granted';
    }

    return false;
  }

  static push(title: string, body: string, type: 'warning' | 'alert' | 'info' | 'success' = 'info') {
    // 1. Add to in-app notification list
    const current = this.getInAppNotifications();
    const newNotif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title,
      body,
      type,
      timestamp: Date.now(),
      isRead: false,
    };
    current.unshift(newNotif);
    this.saveInAppNotifications(current);

    // 2. Dispatch system web push notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Web notification dispatch failed:', e);
      }
    }
  }

  static markAllAsRead() {
    const list = this.getInAppNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.saveInAppNotifications(updated);
  }

  static clearAll() {
    this.saveInAppNotifications([]);
  }

  /**
   * Evaluates today's expense against daily limit and sends warnings
   */
  static checkDailyLimitWarning(todayExpense: number, dailyLimit: number, remainingDays: number) {
    if (dailyLimit <= 0) return;

    const ratio = todayExpense / dailyLimit;

    if (ratio >= 1.0) {
      this.push(
        '🚨 Peringatan: Melebihi Limit Harian!',
        `Pengeluaran hari ini Rp ${todayExpense.toLocaleString('id-ID')} telah melebihi limit harian Rp ${dailyLimit.toLocaleString('id-ID')}. Sisa ${remainingDays} hari ke depan perlu pengetatan ekstra!`,
        'alert'
      );
    } else if (ratio >= 0.8) {
      this.push(
        '⚠️ Waspada: Mendekati Limit Harian (80%)',
        `Pengeluaran hari ini sudah mencapai Rp ${todayExpense.toLocaleString('id-ID')} dari batas Rp ${dailyLimit.toLocaleString('id-ID')}. Sebaiknya tahan pengeluaran non-primer hari ini.`,
        'warning'
      );
    }
  }

  /**
   * Evaluates custom category rules against spending
   */
  static checkCategoryRules(transactions: Transaction[], currentMonth: string) {
    const rules = this.getCategoryRules().filter((r) => r.isEnabled);
    if (rules.length === 0) return;

    // Calculate current month's expenses per category
    const catMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    rules.forEach((rule) => {
      const spent = catMap[rule.category] || 0;
      if (rule.thresholdAmount <= 0) return;

      if (spent >= rule.thresholdAmount) {
        this.push(
          `🚨 Batas Kategori Terlampaui: ${rule.category}!`,
          `Pengeluaran untuk kategori '${rule.category}' telah mencapai Rp ${spent.toLocaleString('id-ID')}, melewati batas aturan Rp ${rule.thresholdAmount.toLocaleString('id-ID')}!`,
          'alert'
        );
      } else if (spent >= rule.thresholdAmount * 0.8) {
        this.push(
          `⚠️ Waspada Batas Kategori: ${rule.category}`,
          `Pengeluaran '${rule.category}' sudah mencapai Rp ${spent.toLocaleString('id-ID')} (≥80% dari batas Rp ${rule.thresholdAmount.toLocaleString('id-ID')}).`,
          'warning'
        );
      }
    });
  }
}
