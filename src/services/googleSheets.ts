import { Transaction, BudgetConfig } from '../types/finance.ts';
import { getAccessToken } from './googleAuth.ts';
import { FinanceDB } from './db.ts';
import firebaseConfigJson from '../../firebase-applet-config.json';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetsSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
  rowCount?: number;
}

export interface AuthLocationDiagnostic {
  timestamp: string;
  contextTag: string;
  windowLocation: {
    origin: string;
    hostname: string;
    host: string;
    pathname: string;
    protocol: string;
    port: string;
    href: string;
  };
  firebaseConfig: {
    projectId: string;
    authDomain: string;
    appId: string;
    storageBucket: string;
    isApiKeyConfigured: boolean;
  };
  oauthEvaluation: {
    currentRedirectUri: string;
    expectedAuthHandlerUrl: string;
    isVercelDeployment: boolean;
    isLocalhost: boolean;
    isFirebaseHosting: boolean;
    authorizedDomainStatus:
      | 'MATCHED_FIREBASE_DEFAULT'
      | 'LOCAL_DEV'
      | 'EXTERNAL_DOMAIN_NEEDS_FIREBASE_CONSOLE_WHITELIST';
    recommendation: string;
  };
  redirectUriAudit?: OAuthRedirectUriAudit;
}

export interface OAuthRedirectUriAudit {
  rawUri: string;
  parsedUrl: {
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    origin: string;
  };
  checks: {
    protocol: {
      status: 'PASS' | 'FAIL';
      value: string;
      required: string;
      detail: string;
    };
    port: {
      status: 'PASS' | 'WARN' | 'FAIL';
      value: string;
      required: string;
      detail: string;
    };
    originFormat: {
      status: 'PASS' | 'FAIL';
      value: string;
      required: string;
      detail: string;
    };
    domainClassification: {
      isVercel: boolean;
      isLocalhost: boolean;
      isFirebaseHosting: boolean;
      domainType: 'VERCEL_PRODUCTION' | 'LOCALHOST_DEV' | 'FIREBASE_HOSTING' | 'CUSTOM_DOMAIN';
    };
    firebaseAuthorizedDomain: {
      requiredDomainEntry: string;
      isInDefaultWhitelist: boolean;
      requiresManualConsoleEntry: boolean;
      detail: string;
    };
    googleOAuthRedirectUri: {
      handlerUri: string;
      javascriptOrigin: string;
      detail: string;
    };
  };
  isFullyCompatible: boolean;
  mismatchReason: string | null;
  remedyInstructions: string[];
}

/**
 * Diagnostic utility function to verify if the redirect URI and origin being sent to Google
 * matches the exact format required by the OAuth provider.
 * Specifically checks for:
 * 1. Protocol mismatch (HTTP vs HTTPS) on production domains like Vercel.
 * 2. Port mismatch (explicit :80, :443, or non-standard ports disallowed on public domains).
 * 3. Domain validation with Firebase Auth and Google OAuth credentials.
 */
export function verifyOAuthRedirectUriFormat(customUri?: string): OAuthRedirectUriAudit {
  const isBrowser = typeof window !== 'undefined';
  const defaultUri = isBrowser ? window.location.href : 'https://m-ber.vercel.app/';
  const uriToTest = customUri || defaultUri;

  let parsed: URL;
  try {
    parsed = new URL(uriToTest, isBrowser ? window.location.origin : 'https://m-ber.vercel.app');
  } catch {
    parsed = new URL('https://m-ber.vercel.app');
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain;

  const isLocalhost =
    parsed.hostname === 'localhost' ||
    parsed.hostname === '127.0.0.1' ||
    parsed.hostname === '::1';
  const isFirebaseHosting =
    parsed.hostname === authDomain ||
    parsed.hostname.endsWith('.firebaseapp.com') ||
    parsed.hostname.endsWith('.web.app');
  const isVercel = parsed.hostname.endsWith('vercel.app');

  let domainType: 'VERCEL_PRODUCTION' | 'LOCALHOST_DEV' | 'FIREBASE_HOSTING' | 'CUSTOM_DOMAIN' =
    'CUSTOM_DOMAIN';
  if (isLocalhost) domainType = 'LOCALHOST_DEV';
  else if (isFirebaseHosting) domainType = 'FIREBASE_HOSTING';
  else if (isVercel) domainType = 'VERCEL_PRODUCTION';

  // 1. Protocol Validation: Google OAuth strictly requires https: on non-localhost
  let protocolStatus: 'PASS' | 'FAIL' = 'PASS';
  let protocolDetail = '';
  if (parsed.protocol === 'https:') {
    protocolStatus = 'PASS';
    protocolDetail = 'HTTPS protocol conforms to Google OAuth provider requirements.';
  } else if (parsed.protocol === 'http:') {
    if (isLocalhost) {
      protocolStatus = 'PASS';
      protocolDetail = 'HTTP protocol is permitted by Google OAuth strictly for localhost development.';
    } else {
      protocolStatus = 'FAIL';
      protocolDetail = `Insecure HTTP protocol detected for ${parsed.hostname}. Google OAuth rejects non-HTTPS redirect URIs on production domains like Vercel. Ensure HTTPS is enforced.`;
    }
  } else {
    protocolStatus = 'FAIL';
    protocolDetail = `Unsupported protocol "${parsed.protocol}". OAuth requires https://.`;
  }

  // 2. Port Validation: Google OAuth disallows explicit standard ports (:80, :443) on all domains, and disallows any custom port on public domains
  let portStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  let portDetail = '';
  if (!parsed.port || parsed.port === '') {
    portStatus = 'PASS';
    portDetail = 'Standard port omitted. Google OAuth provider requires public domains (like Vercel) to omit standard ports (:80, :443).';
  } else if (parsed.port === '80' || parsed.port === '443') {
    portStatus = 'FAIL';
    portDetail = `Explicit standard port :${parsed.port} detected. Google OAuth rejects redirect URIs with explicit :80 or :443 ports. Remove port from URI.`;
  } else {
    if (isLocalhost) {
      portStatus = 'PASS';
      portDetail = `Port :${parsed.port} on localhost is permitted by Google OAuth provider.`;
    } else {
      portStatus = 'FAIL';
      portDetail = `Explicit non-standard port :${parsed.port} detected on public domain "${parsed.hostname}". Google OAuth provider rejects redirect URIs with explicit ports on public domains.`;
    }
  }

  // 3. Origin Format Validation: No trailing slashes, clean origin
  let originFormatStatus: 'PASS' | 'FAIL' = 'PASS';
  let originFormatDetail = '';
  const expectedOrigin = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;
  if (parsed.origin === expectedOrigin) {
    originFormatStatus = 'PASS';
    originFormatDetail = `JavaScript Origin "${parsed.origin}" conforms to OAuth standards (no trailing slash, standard structure).`;
  } else {
    originFormatStatus = 'FAIL';
    originFormatDetail = `JavaScript Origin mismatch: Got "${parsed.origin}", expected "${expectedOrigin}".`;
  }

  // 4. Firebase Authorized Domains Check
  const requiresManualConsoleEntry = !isLocalhost && !isFirebaseHosting;
  const firebaseDetail = requiresManualConsoleEntry
    ? `Domain "${parsed.hostname}" is a third-party host (Vercel) and is NOT in Firebase default domain whitelist. Must be added to Firebase Console > Authentication > Settings > Authorized domains.`
    : `Domain "${parsed.hostname}" is natively whitelisted in Firebase Auth.`;

  // 5. Overall compatibility assessment
  const isFullyCompatible =
    protocolStatus === 'PASS' &&
    portStatus === 'PASS' &&
    originFormatStatus === 'PASS' &&
    !requiresManualConsoleEntry;

  let mismatchReason: string | null = null;
  const remedyInstructions: string[] = [];

  if (protocolStatus === 'FAIL') {
    mismatchReason = 'PROTOCOL_MISMATCH_HTTP_NOT_ALLOWED';
    remedyInstructions.push(
      `Ganti protokol dari ${parsed.protocol} ke https://. Google OAuth mewajibkan HTTPS untuk domain produksi.`
    );
  }
  if (portStatus === 'FAIL') {
    mismatchReason = mismatchReason || 'PORT_MISMATCH_EXPLICIT_PORT_NOT_ALLOWED';
    remedyInstructions.push(
      `Hapus port :${parsed.port} dari URL. Google OAuth tidak mengizinkan port eksplisit pada domain publik Vercel.`
    );
  }
  if (requiresManualConsoleEntry) {
    mismatchReason = mismatchReason || 'UNAUTHORIZED_DOMAIN_IN_FIREBASE';
    remedyInstructions.push(
      `Buka Firebase Console (Project: ${projectId}) > Authentication > Settings > Authorized domains, lalu klik 'Add domain' dan masukkan "${parsed.hostname}".`
    );
  }

  const audit: OAuthRedirectUriAudit = {
    rawUri: uriToTest,
    parsedUrl: {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      origin: parsed.origin,
    },
    checks: {
      protocol: {
        status: protocolStatus,
        value: parsed.protocol,
        required: 'https: (or http: on localhost only)',
        detail: protocolDetail,
      },
      port: {
        status: portStatus,
        value: parsed.port ? `:${parsed.port}` : '(omitted)',
        required: '(omitted for production domains)',
        detail: portDetail,
      },
      originFormat: {
        status: originFormatStatus,
        value: parsed.origin,
        required: expectedOrigin,
        detail: originFormatDetail,
      },
      domainClassification: {
        isVercel,
        isLocalhost,
        isFirebaseHosting,
        domainType,
      },
      firebaseAuthorizedDomain: {
        requiredDomainEntry: parsed.hostname,
        isInDefaultWhitelist: !requiresManualConsoleEntry,
        requiresManualConsoleEntry,
        detail: firebaseDetail,
      },
      googleOAuthRedirectUri: {
        handlerUri: `https://${authDomain}/__/auth/handler`,
        javascriptOrigin: parsed.origin,
        detail: `OAuth handler used by Firebase SDK: https://${authDomain}/__/auth/handler`,
      },
    },
    isFullyCompatible,
    mismatchReason,
    remedyInstructions,
  };

  console.group(`[OAuth Diagnostic Audit] Redirect URI & Protocol/Port Validation (${parsed.hostname})`);
  console.table([
    {
      Parameter: 'Protocol',
      TestedValue: audit.checks.protocol.value,
      RequiredFormat: audit.checks.protocol.required,
      Status: audit.checks.protocol.status,
    },
    {
      Parameter: 'Port',
      TestedValue: audit.checks.port.value,
      RequiredFormat: audit.checks.port.required,
      Status: audit.checks.port.status,
    },
    {
      Parameter: 'JavaScript Origin',
      TestedValue: audit.checks.originFormat.value,
      RequiredFormat: audit.checks.originFormat.required,
      Status: audit.checks.originFormat.status,
    },
    {
      Parameter: 'Domain Whitelist (Firebase)',
      TestedValue: audit.checks.firebaseAuthorizedDomain.requiredDomainEntry,
      RequiredFormat: 'Listed in Firebase Console Authorized Domains',
      Status: audit.checks.firebaseAuthorizedDomain.requiresManualConsoleEntry ? 'NEEDS_ACTION' : 'PASS',
    },
  ]);

  if (audit.mismatchReason) {
    console.warn(`[OAuth Diagnostic] Issue Identified: ${audit.mismatchReason}`);
    console.warn('[OAuth Diagnostic] Actionable Steps:', audit.remedyInstructions);
  } else {
    console.info('[OAuth Diagnostic] All URI formatting & domain requirements verified successfully.');
  }
  console.groupEnd();

  return audit;
}

export class GoogleSheetsService {
  /**
   * Diagnostic utility function to verify if the redirect URI and origin being sent to Google
   * matches the exact format required by the OAuth provider.
   */
  static verifyOAuthRedirectUriFormat(customUri?: string): OAuthRedirectUriAudit {
    return verifyOAuthRedirectUriFormat(customUri);
  }

  /**
   * Diagnostic utility that captures and logs the complete window location context
   * during Firebase Auth initialization and OAuth token exchanges.
   * Compares the current origin against Firebase authorized domain requirements on Vercel.
   */
  static logAuthEnvironmentDiagnostics(
    contextTag: string = 'Firebase Auth Initialization'
  ): AuthLocationDiagnostic {
    const isBrowser = typeof window !== 'undefined';
    const loc = isBrowser
      ? window.location
      : {
          origin: '',
          hostname: '',
          host: '',
          pathname: '',
          protocol: '',
          port: '',
          href: '',
        };

    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId;
    const storageBucket =
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket;
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey;

    const isLocalhost =
      loc.hostname === 'localhost' ||
      loc.hostname === '127.0.0.1' ||
      loc.hostname === '::1';
    const isFirebaseHosting =
      loc.hostname === authDomain ||
      loc.hostname.endsWith('.firebaseapp.com') ||
      loc.hostname.endsWith('.web.app');
    const isVercel = loc.hostname.endsWith('vercel.app');

    let authorizedDomainStatus:
      | 'MATCHED_FIREBASE_DEFAULT'
      | 'LOCAL_DEV'
      | 'EXTERNAL_DOMAIN_NEEDS_FIREBASE_CONSOLE_WHITELIST' =
      'EXTERNAL_DOMAIN_NEEDS_FIREBASE_CONSOLE_WHITELIST';
    let recommendation = '';

    if (isLocalhost) {
      authorizedDomainStatus = 'LOCAL_DEV';
      recommendation =
        'Local development environment detected (localhost is authorized by default).';
    } else if (isFirebaseHosting) {
      authorizedDomainStatus = 'MATCHED_FIREBASE_DEFAULT';
      recommendation =
        'Firebase hosting domain detected (authorized by default).';
    } else {
      authorizedDomainStatus = 'EXTERNAL_DOMAIN_NEEDS_FIREBASE_CONSOLE_WHITELIST';
      recommendation = `Domain "${loc.hostname}" requires explicit addition in Firebase Console: Authentication > Settings > Authorized domains to prevent "auth/unauthorized-domain" errors.`;
    }

    // Run the specific redirect URI & protocol/port audit
    const redirectUriAudit = verifyOAuthRedirectUriFormat(loc.href);

    const diagnostic: AuthLocationDiagnostic = {
      timestamp: new Date().toISOString(),
      contextTag,
      windowLocation: {
        origin: loc.origin,
        hostname: loc.hostname,
        host: loc.host,
        pathname: loc.pathname,
        protocol: loc.protocol,
        port: loc.port,
        href: loc.href,
      },
      firebaseConfig: {
        projectId,
        authDomain,
        appId,
        storageBucket,
        isApiKeyConfigured: !!apiKey,
      },
      oauthEvaluation: {
        currentRedirectUri: `${loc.origin}${loc.pathname}`,
        expectedAuthHandlerUrl: `https://${authDomain}/__/auth/handler`,
        isVercelDeployment: isVercel,
        isLocalhost,
        isFirebaseHosting,
        authorizedDomainStatus,
        recommendation,
      },
      redirectUriAudit,
    };

    console.group(`[GoogleSheetsService Diagnostic] ${contextTag} (Origin: ${loc.origin || 'N/A'})`);
    console.log('[Diagnostic] Window Location Context:', diagnostic.windowLocation);
    console.log('[Diagnostic] Firebase Auth Configuration:', diagnostic.firebaseConfig);
    console.log('[Diagnostic] OAuth & Redirect URI Evaluation:', diagnostic.oauthEvaluation);
    if (authorizedDomainStatus === 'EXTERNAL_DOMAIN_NEEDS_FIREBASE_CONSOLE_WHITELIST') {
      console.warn(
        `[Diagnostic Notice] Vercel Domain Check: "${loc.hostname}" is not a default Firebase domain. Verify that "${loc.hostname}" is listed in Firebase Console > Authentication > Settings > Authorized domains.`
      );
    } else {
      console.info(`[Diagnostic Status] Domain "${loc.hostname}" is natively supported.`);
    }
    console.groupEnd();

    return diagnostic;
  }

  /**
   * Syncs transactions and monthly budget directly to Google Sheets using OAuth Access Token
   */
  static async syncDirectOAuth(
    transactions: Transaction[],
    budgetConfig: BudgetConfig,
    existingSpreadsheetId?: string | null
  ): Promise<SheetsSyncResult> {
    // Run diagnostic to capture current origin and auth domain context
    GoogleSheetsService.logAuthEnvironmentDiagnostics('Google Sheets Direct OAuth Execution');

    console.group('[GoogleSheetsService] syncDirectOAuth Execution');
    console.log('[GoogleSheetsService] Initiating sync with params:', {
      transactionCount: transactions.length,
      month: budgetConfig.month,
      city: budgetConfig.cityContext,
      hasExistingSpreadsheetId: !!existingSpreadsheetId,
      existingSpreadsheetId,
    });

    const token = await getAccessToken();
    if (!token) {
      console.error('[GoogleSheetsService][Phase: Token Acquisition Failure] No OAuth access token found in memory.');
      console.error('[GoogleSheetsService] Diagnostic: The user must complete Firebase Google Sign-In with Sheets scopes first.');
      console.groupEnd();
      throw new Error('Belum masuk dengan akun Google. Silakan klik Masuk dengan Google terlebih dahulu.');
    }

    console.log('[GoogleSheetsService][Phase: Token Verification] Valid OAuth Access Token retrieved from session.', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...',
    });

    try {
      let spreadsheetId = existingSpreadsheetId;
      let spreadsheetUrl = '';

      // 1. Create spreadsheet if it doesn't exist
      if (!spreadsheetId) {
        FinanceDB.logSync('Membuat Google Spreadsheet baru di Google Drive Anda...');
        console.log('[GoogleSheetsService][Phase: Google API Scope Authorization] Requesting spreadsheet creation at:', SHEETS_API_BASE);

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
          console.group('[GoogleSheetsService][Phase: Google API Scope Failure] Spreadsheet Creation Rejected');
          console.error('HTTP Status:', createRes.status, createRes.statusText);
          console.error('Raw Google API Error Response Body:', JSON.stringify(errData, null, 2));
          console.error('Analyzed Failure Reason:', {
            isScopeMissing: createRes.status === 403 && (JSON.stringify(errData).includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') || JSON.stringify(errData).includes('PERMISSION_DENIED')),
            isTokenExpiredOrInvalid: createRes.status === 401,
            googleErrorMessage: errData?.error?.message,
            googleErrorStatus: errData?.error?.status,
            googleErrorDetails: errData?.error?.details,
          });
          console.groupEnd();

          throw new Error(
            errData?.error?.message ||
              `Gagal membuat spreadsheet (Google API Status: ${createRes.status} ${createRes.statusText})`
          );
        }

        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
        spreadsheetUrl = createData.spreadsheetUrl;
        console.log('[GoogleSheetsService][Phase: Spreadsheet Created] ID:', spreadsheetId, 'URL:', spreadsheetUrl);
      } else {
        spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        console.log('[GoogleSheetsService] Using existing spreadsheet:', spreadsheetId);
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
      const updateEndpoint = `${SHEETS_API_BASE}/${spreadsheetId}/values/Pencatatan_Transaksi!A1:J${transactionValues.length}?valueInputOption=USER_ENTERED`;
      console.log('[GoogleSheetsService][Phase: Google API Scope Authorization] Updating transactions at:', updateEndpoint);

      const updateTxRes = await fetch(
        updateEndpoint,
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
        console.group('[GoogleSheetsService][Phase: Google API Scope Failure] Update Transactions Rejected');
        console.error('HTTP Status:', updateTxRes.status, updateTxRes.statusText);
        console.error('Raw Google API Error Response Body:', JSON.stringify(errData, null, 2));
        console.groupEnd();
        throw new Error(errData?.error?.message || `Gagal memperbarui sheet transaksi (Status: ${updateTxRes.status})`);
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

      const summaryEndpoint = `${SHEETS_API_BASE}/${spreadsheetId}/values/Ringkasan_Anggaran!A1:B${summaryValues.length}?valueInputOption=USER_ENTERED`;
      console.log('[GoogleSheetsService] Updating summary at:', summaryEndpoint);

      const summaryRes = await fetch(
        summaryEndpoint,
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

      if (!summaryRes.ok) {
        const errData = await summaryRes.json().catch(() => ({}));
        console.warn('[GoogleSheetsService] Warning updating summary sheet:', errData);
      }

      // Save spreadsheet ID to local status
      const syncStatus = FinanceDB.getSyncStatus();
      syncStatus.sheetsSpreadsheetId = spreadsheetId || null;
      syncStatus.sheetsSpreadsheetUrl = spreadsheetUrl || null;
      syncStatus.lastSyncedAt = Date.now();
      FinanceDB.saveSyncStatus(syncStatus);

      // Mark all transactions as synced locally
      FinanceDB.markAllTransactionsSynced();
      FinanceDB.logSync(`Berhasil sinkronisasi ${transactions.length} transaksi ke Google Sheets.`);
      console.log('[GoogleSheetsService] Sync completed successfully.');
      console.groupEnd();

      return {
        success: true,
        spreadsheetId: spreadsheetId || undefined,
        spreadsheetUrl,
        rowCount: transactions.length,
        message: `Berhasil tersinkronisasi ke Google Sheets (${transactions.length} transaksi).`,
      };
    } catch (error: any) {
      console.groupEnd();
      console.group('[GoogleSheetsService: FINAL FAILURE DIAGNOSTIC]');
      console.error('Error Name:', error?.name);
      console.error('Error Message:', error?.message);
      console.error('Error Code:', error?.code);
      console.error('Stack Trace:', error?.stack);
      console.error('Full Error Object:', error);
      console.groupEnd();

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

// Make diagnostic utility accessible on window for browser console troubleshooting
if (typeof window !== 'undefined') {
  (window as any).GoogleSheetsService = GoogleSheetsService;
  (window as any).verifyOAuthRedirectUriFormat = verifyOAuthRedirectUriFormat;
}

