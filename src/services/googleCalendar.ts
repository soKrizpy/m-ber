import { getAccessToken } from './googleAuth.ts';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEventPayload {
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
}

export class GoogleCalendarService {
  /**
   * Adds a budget reminder / evaluation event to user's Google Calendar.
   */
  static async createBudgetReminderEvent(payload: CalendarEventPayload): Promise<{ id: string; htmlLink: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Belum terhubung dengan akun Google. Silakan masuk terlebih dahulu.');
    }

    const startDateTime = payload.startTime
      ? `${payload.startDate}T${payload.startTime}:00+07:00`
      : `${payload.startDate}T09:00:00+07:00`;
    
    const endDateTime = payload.endTime
      ? `${payload.startDate}T${payload.endTime}:00+07:00`
      : `${payload.startDate}T10:00:00+07:00`;

    const eventBody = {
      summary: payload.summary,
      description: `${payload.description}\n\n(Dibuat otomatis oleh Dompet Pintar Cimahi)`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Jakarta',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 120 },
        ],
      },
    };

    const res = await fetch(CALENDAR_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Gagal menambahkan jadwal pengingat ke Google Calendar.');
    }

    return await res.json();
  }
}
