import { Transaction, BudgetConfig } from '../types/finance.ts';
import { getAccessToken } from './googleAuth.ts';
import { FinanceDB } from './db.ts';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetsSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
  rowCount?: number;
}

export class GoogleSheetsService {
  /**
   * Syncs transactions and monthly budget directly to Google Sheets using OAuth Access Token
   */
  static async syncDirectOAuth(
    transactions: Transaction[],
    budgetConfig: BudgetConfig,
    existingSpreadsheetId?: string | null
  ): Promise<SheetsSyncResult> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Belum masuk dengan akun Google. Silakan klik Masuk dengan Google terlebih dahulu.');
    }

    try {
      let spreadsheetId = existingSpreadsheetId;
      let spreadsheetUrl = '';

      // 1. Create spreadsheet if it doesn't exist
      if (!spreadsheetId) {
        FinanceDB.logSync('Membuat Google Spreadsheet baru di Google Drive Anda...');
        const createRes = await fetch(SHEETS_API_BASE, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              title: `Dompet Pintar Cimahi - Anggaran ${budgetConfig.month}`,
            },
            sheets: [
              { properties: { title: 'Pencatatan_Transaksi' } },
              { properties: { title: 'Ringkasan_Anggaran' } },
            ],
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Gagal membuat spreadsheet (Status: ${createRes.status})`);
        }

        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
        spreadsheetUrl = createData.spreadsheetUrl;
      } else {
        spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      }

      // 2. Prepare transaction rows
      const transactionHeaders = [
        'ID Transaksi',
        'Tanggal',
        'Waktu',
        'Jenis',
        'Kategori',
        'Nominal (Rp)',
        'Keterangan / Tempat Belanja',
        'Metode Pembayaran',
        'Status Sinkron',
        'Waktu Rekam',
      ];

      const transactionRows = transactions.map((t) => [
        t.id,
        t.date,
        t.time || '-',
        t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
        t.category,
        t.amount,
        t.description,
        t.paymentMethod,
        'Tersinkronisasi',
        new Date(t.createdAt).toLocaleString('id-ID'),
      ]);

      const transactionValues = [transactionHeaders, ...transactionRows];

      // Update Pencatatan_Transaksi sheet
      FinanceDB.logSync('Mengirim data transaksi ke Google Sheets...');
      const updateTxRes = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/Pencatatan_Transaksi!A1:J${transactionValues.length}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `Pencatatan_Transaksi!A1:J${transactionValues.length}`,
            majorDimension: 'ROWS',
            values: transactionValues,
          }),
        }
      );

      if (!updateTxRes.ok) {
        const errData = await updateTxRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Gagal memperbarui sheet transaksi');
      }

      // 3. Update Ringkasan_Anggaran sheet
      const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = budgetConfig.monthlyBudget - totalExpense;

      const summaryValues = [
        ['Parameter', 'Nilai / Keterangan'],
        ['Bulan Anggaran', budgetConfig.month],
        ['Wilayah Acuan', budgetConfig.cityContext],
        ['Target Anggaran Bulanan', budgetConfig.monthlyBudget],
        ['Total Pemasukan Tercatat', totalIncome],
        ['Total Pengeluaran Tercatat', totalExpense],
        ['Sisa Anggaran Tersedia', remaining],
        ['Jumlah Transaksi', transactions.length],
        ['Waktu Sinkronisasi Terakhir', new Date().toLocaleString('id-ID')],
      ];

      await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/Ringkasan_Anggaran!A1:B${summaryValues.length}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `Ringkasan_Anggaran!A1:B${summaryValues.length}`,
            majorDimension: 'ROWS',
            values: summaryValues,
          }),
        }
      );

      // Save spreadsheet ID to local status
      const syncStatus = FinanceDB.getSyncStatus();
      syncStatus.sheetsSpreadsheetId = spreadsheetId || null;
      syncStatus.sheetsSpreadsheetUrl = spreadsheetUrl || null;
      syncStatus.lastSyncedAt = Date.now();
      FinanceDB.saveSyncStatus(syncStatus);

      // Mark all transactions as synced locally
      FinanceDB.markAllTransactionsSynced();
      FinanceDB.logSync(`Berhasil sinkronisasi ${transactions.length} transaksi ke Google Sheets.`);

      return {
        success: true,
        spreadsheetId: spreadsheetId || undefined,
        spreadsheetUrl,
        rowCount: transactions.length,
        message: `Berhasil tersinkronisasi ke Google Sheets (${transactions.length} transaksi).`,
      };
    } catch (error: any) {
      FinanceDB.logSync(`Gagal sinkronisasi Sheets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Syncs via Google Apps Script (GAS) Web App endpoint (Alternative free-hosting option)
   */
  static async syncViaAppsScript(
    gasWebAppUrl: string,
    transactions: Transaction[],
    budgetConfig: BudgetConfig
  ): Promise<SheetsSyncResult> {
    if (!gasWebAppUrl || !gasWebAppUrl.startsWith('https://script.google.com/')) {
      throw new Error('URL Google Apps Script tidak valid. Pastikan berawalan https://script.google.com/');
    }

    FinanceDB.logSync('Menghubungkan ke Google Apps Script Web App...');

    const payload = {
      action: 'syncData',
      budgetConfig,
      transactions,
      timestamp: Date.now(),
    };

    const res = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Plain text avoids CORS preflight issues with GAS
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (data.status === 'success' || res.ok) {
      FinanceDB.markAllTransactionsSynced();
      const syncStatus = FinanceDB.getSyncStatus();
      syncStatus.gasWebAppUrl = gasWebAppUrl;
      syncStatus.lastSyncedAt = Date.now();
      if (data.spreadsheetUrl) {
        syncStatus.sheetsSpreadsheetUrl = data.spreadsheetUrl;
      }
      FinanceDB.saveSyncStatus(syncStatus);
      FinanceDB.logSync(`Sinkronisasi Google Apps Script sukses (${transactions.length} transaksi).`);

      return {
        success: true,
        spreadsheetUrl: data.spreadsheetUrl,
        message: 'Data berhasil disinkronkan melalui Google Apps Script Web App.',
      };
    } else {
      throw new Error(data.message || 'Gagal sinkronisasi dengan Google Apps Script.');
    }
  }

  /**
   * Ready-to-use Google Apps Script code snippet for users
   */
  static getAppsScriptCode(): string {
    return `/**
 * DOMPET PINTAR CIMAHI - BACKEND GOOGLE APPS SCRIPT
 * Panduan Pemasangan:
 * 1. Buka https://sheets.new (Buat Spreadsheet baru)
 * 2. Klik menu 'Ekstensi' > 'Apps Script'
 * 3. Hapus kode bawaan dan tempel (paste) seluruh kode ini.
 * 4. Klik 'Terapkan' (Deploy) > 'Penerapan Baru' (New Deployment).
 * 5. Pilih jenis 'Aplikasi Web' (Web App).
 *    - Jalankan sebagai: 'Saya' (Me)
 *    - Siapa yang memiliki akses: 'Siapa saja' (Anyone)
 * 6. Klik 'Terapkan', lalu salin URL Aplikasi Web ke Dompet Pintar Cimahi.
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Sheet Transaksi
    var txSheet = ss.getSheetByName('Pencatatan_Transaksi');
    if (!txSheet) {
      txSheet = ss.insertSheet('Pencatatan_Transaksi');
    }
    txSheet.clear();

    var headers = ['ID Transaksi', 'Tanggal', 'Waktu', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Metode Bayar', 'Waktu Rekam'];
    var rows = [headers];

    if (data.transactions && data.transactions.length > 0) {
      for (var i = 0; i < data.transactions.length; i++) {
        var t = data.transactions[i];
        rows.push([
          t.id,
          t.date,
          t.time || '-',
          t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
          t.category,
          t.amount,
          t.description,
          t.paymentMethod,
          new Date(t.createdAt).toLocaleString('id-ID')
        ]);
      }
    }

    txSheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
    txSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
    txSheet.autoResizeColumns(1, headers.length);

    // Sheet Ringkasan
    var sumSheet = ss.getSheetByName('Ringkasan_Anggaran');
    if (!sumSheet) {
      sumSheet = ss.insertSheet('Ringkasan_Anggaran');
    }
    sumSheet.clear();

    var summaryRows = [
      ['Parameter', 'Nilai'],
      ['Bulan Anggaran', data.budgetConfig.month || '-'],
      ['Wilayah Acuan', data.budgetConfig.cityContext || 'Cimahi'],
      ['Target Anggaran Bulanan (Rp)', data.budgetConfig.monthlyBudget || 0],
      ['Jumlah Transaksi', data.transactions ? data.transactions.length : 0],
      ['Terakhir Diperbarui', new Date().toLocaleString('id-ID')]
    ];
    sumSheet.getRange(1, 1, summaryRows.length, 2).setValues(summaryRows);
    sumSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff');

    var result = {
      status: 'success',
      message: 'Data berhasil disinkronkan ke Google Sheets',
      spreadsheetUrl: ss.getUrl()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    var errorResult = {
      status: 'error',
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    app: 'Dompet Pintar Cimahi Backend',
    spreadsheetUrl: ss.getUrl()
  })).setMimeType(ContentService.MimeType.JSON);
}`;
  }
}
