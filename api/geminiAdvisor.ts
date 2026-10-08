import { GoogleGenAI, Type } from '@google/genai';

// Initialize server-side Gemini client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface DailySmartTip {
  title: string;
  category: 'Pangan Hemat' | 'Promo Belanja' | 'Batas Harian' | 'Trik Cuan';
  summary: string;
  actionableAdvice: string;
  locationOrPlace: string; // e.g. "Pasar Antri Baru", "Borma Gandawijaya", "Pasar Atas"
  estimatedSavings: string; // e.g. "Rp 25.000 - Rp 50.000"
}

export async function generateDailySmartTips(context: FinancialContext): Promise<DailySmartTip[]> {
  const model = 'gemini-3.8-flash';

  const systemInstruction = `Anda adalah "Kang Tambal", kurator tips belanja hemat dan pengelolaan anggaran harian untuk warga Kota Cimahi dan Kabupaten Bandung Barat (KBB), mencakup:
- Kabupaten Bandung Barat: Area Jl. H. Gofur / Haji Ghofur, PakuHaji / Wisata Kuda Pakuhaji, Desa Cilame, Kecamatan Ngamprah (Kompleks Pemkab KBB / Stasiun KCIC Padalarang / Jl. Raya Cilame - Gadobangkong), serta Padalarang.
- Kota Cimahi: Cipageran (Cimahi Utara), Cimahi Tengah (Gandawijaya, Sangkuriang, Pasar Atas Baru, Pasar Antri Baru), Cimahi Selatan (Kerkof, Leuwigajah, Baros), dan Cimindi.

Tugas Anda adalah menghasilkan 3 sampai 4 tips cerdas praktis untuk HARI INI yang disesuaikan dengan kondisi riil belanja pengguna saat ini:
1. Pangan Hemat: Substitusi bahan makanan mahal dengan alternatif bergizi murah (ikan tongkol/kembung segar di Pasar Tradisional Atas Baru Cimahi atau pasar kaget Haji Ghofur/Cilame; tempe/tahu Cibuntu murah; sayuran segar petani Lembang & Cisarua/Pakuhaji dengan harga kebun langsung; beras SPHP Bulog).
2. Promo Belanja & Supermarket: Rekomendasi promo belanja hemat di supermarket & minimarket area terkait:
   - Super Indo Cimahi (Sangkuriang / Gatot Subroto) & Super Indo terdekat
   - Borma Toserba (Borma Gandawijaya, Borma Kerkof, Borma Dakota, atau Borma Toserba terdekat)
   - Transmart Cimahi / Lotte Grosir Padalarang
   - Yomart & Alfamart/Indomaret promo JSM di sepanjang Jl. Haji Ghofur, Cilame Ngamprah, dan Cipageran
   - Toko Grosir Sembako & Pasar Kaget PakuHaji / Cilame Permai / Permata Cimahi
3. Batas Harian: Pacing anggaran agar sisa uang (Rp ${context.remainingBudget.toLocaleString('id-ID')}) cukup untuk ${context.remainingDays} hari ke depan (limit hari ini: Rp ${Math.round(context.dailyLimit).toLocaleString('id-ID')}).
4. Trik Cuan: Opsi tambahan uang atau efisiensi pengeluaran jika pengeluaran hari ini sudah mepet.`;

  const promptText = `Hasilkan 3-4 tips belanja cerdas untuk hari ini berdasarkan data keuangan:
- Sisa Anggaran 30 Hari: Rp ${context.remainingBudget.toLocaleString('id-ID')}
- Sisa Hari: ${context.remainingDays} hari lagi
- Limit Belanja Hari Ini: Rp ${Math.round(context.dailyLimit).toLocaleString('id-ID')}
- Pengeluaran Hari Ini: Rp ${context.todayExpense.toLocaleString('id-ID')} (${
    context.todayExpense > context.dailyLimit
      ? 'Melebihi limit'
      : context.todayExpense >= context.dailyLimit * 0.8
      ? 'Mendekati limit'
      : 'Aman'
  })
- Kategori Belanja Terbesar: ${Object.keys(context.categoriesBreakdown).slice(0, 3).join(', ') || 'Belanja umum'}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Judul singkat tips (4-7 kata)' },
              category: {
                type: Type.STRING,
                description: 'Pangan Hemat, Promo Belanja, Batas Harian, atau Trik Cuan',
              },
              summary: { type: Type.STRING, description: 'Ringkasan singkat tips' },
              actionableAdvice: { type: Type.STRING, description: 'Langkah praktis yang bisa dilakukan pengguna hari ini' },
              locationOrPlace: {
                type: Type.STRING,
                description:
                  'Tempat belanja lokal Cimahi & KBB terkait (contoh: Area Haji Ghofur, Cilame Ngamprah, Cipageran, PakuHaji, Borma, Super Indo Sangkuriang, Pasar Atas Baru)',
              },
              estimatedSavings: { type: Type.STRING, description: 'Estimasi penghematan (contoh: Rp 15.000 - Rp 30.000)' },
            },
            required: ['title', 'category', 'summary', 'actionableAdvice', 'locationOrPlace', 'estimatedSavings'],
          },
        },
      },
    });

    const parsed: DailySmartTip[] = JSON.parse(response.text || '[]');
    return parsed.length > 0 ? parsed : getFallbackDailyTips();
  } catch (error) {
    console.error('Error in generateDailySmartTips:', error);
    return getFallbackDailyTips();
  }
}

function getFallbackDailyTips(): DailySmartTip[] {
  return [
    {
      title: 'Sayur Segar Petani Langsung Jalur Haji Ghofur - PakuHaji',
      category: 'Pangan Hemat',
      summary: 'Sayuran segar harga kebun dari perbatasan Cisarua & PakuHaji',
      actionableAdvice: 'Beli sayuran hijau (bayam, kangkung, sawi, wortel) langsung di pedagang lokal Jl. Haji Ghofur & PakuHaji untuk selisih hemat hingga 40% dibanding supermarket.',
      locationOrPlace: 'Area Haji Ghofur & PakuHaji (KBB)',
      estimatedSavings: 'Rp 20.000 - Rp 40.000',
    },
    {
      title: 'Pantau Promo JSM Minyak & Sembako Borma & Minimarket Cilame',
      category: 'Promo Belanja',
      summary: 'Manfaatkan diskon akhir pekan untuk kebutuhan pokok keluarga',
      actionableAdvice: 'Cek promo JSM minyak goreng Minyakita & sabun cuci di Super Indo Cimahi, Borma, atau minimarket waralaba sepanjang Jl. Raya Cilame Ngamprah & Cipageran.',
      locationOrPlace: 'Desa Cilame Ngamprah & Cipageran',
      estimatedSavings: 'Rp 15.000 - Rp 35.000',
    },
    {
      title: 'Belanja Lauk Protein Segar di Pasar Tradisional & Pasar Kaget',
      category: 'Pangan Hemat',
      summary: 'Alternatif ikan tongkol dan kembung segar pengganti daging',
      actionableAdvice: 'Substitusi daging sapi dengan ikan kembung segar di Pasar Atas Baru atau pedagang basah Cipageran/Permata Cimahi seharga Rp 35.000/kg.',
      locationOrPlace: 'Pasar Atas Baru & Cipageran',
      estimatedSavings: 'Rp 40.000 - Rp 70.000',
    },
    {
      title: 'Kendalikan Kuota Belanja Harian di Bawah Limit',
      category: 'Batas Harian',
      summary: 'Jaga jatah pengeluaran harian agar saldo bulanan tetap aman',
      actionableAdvice: 'Alokasikan belanja harian sesuai batas limit sistem, hindari jajan konsumtif spontan di rute perjalanan Cimahi - Padalarang.',
      locationOrPlace: 'Ngamprah & Cimahi Utara',
      estimatedSavings: 'Rp 25.000 - Rp 50.000',
    },
  ];
}


export interface FinancialContext {
  monthlyBudget: number;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  daysInMonth: number;
  currentDay: number;
  remainingDays: number;
  dailyLimit: number;
  todayExpense: number;
  categoriesBreakdown: Record<string, number>;
  recentTransactions: Array<{
    date: string;
    category: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
  }>;
  userPrompt?: string;
  cityContext?: string;
}

export async function chatBudgetAdvisor(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  context: FinancialContext
) {
  const model = 'gemini-3.8-flash';

  const systemInstruction = `Anda adalah "Kang Tambal", chatbot asisten keuangan interaktif pribadi khusus wilayah Kota Cimahi dan Kabupaten Bandung Barat (KBB), mencakup:
- Kabupaten Bandung Barat: Area Jl. Haji Ghofur (H. Gofur), PakuHaji, Desa Cilame, Kecamatan Ngamprah (Kompleks Pemkab KBB / Stasiun Padalarang KCIC / Gadobangkong), Tani Mulya, dan Padalarang.
- Kota Cimahi: Cipageran, Cimahi Utara, Cimahi Tengah (Gandawijaya, Sangkuriang, Pasar Atas Baru, Pasar Antri Baru), Cimahi Selatan (Kerkof, Leuwigajah, Baros), dan Cimindi.

Peran Utama Anda:
1. Menganalisis pengeluaran aktual pengguna secara real-time dan memberikan saran anggaran bulanan (target 30 hari).
2. Memberikan tips substitusi bahan makanan pokok lokal Cimahi & KBB:
   - Sayur segar murah langsung dari petani Lembang & Cisarua/PakuHaji yang dijual di jalur Jl. Haji Ghofur & PakuHaji.
   - Ikan kembung, tongkol, lele, telur ayam ras di Pasar Atas Baru Cimahi atau pasar kaget Cilame Permai / Cipageran sebagai substitusi hemat daging sapi.
   - Tahu tempe Cibuntu/Cimahi & beras SPHP Bulog.
3. Memantau promo supermarket & minimarket lokal terdekat:
   - Promo JSM Borma Toserba (Borma Gandawijaya, Kerkof, Dakota).
   - Super Indo Cimahi (Sangkuriang / Gatot Subroto) untuk diskon buah & protein hewani.
   - Promo mingguan supermarket/minimarket sepanjang Jl. Raya Cilame Ngamprah, Haji Ghofur, Cipageran, dan Lotte Mart / Transmart Padalarang.
4. Menilai apakah pengeluaran hari ini (Rp ${context.todayExpense.toLocaleString('id-ID')}) aman atau melebihi limit harian (Rp ${context.dailyLimit.toLocaleString('id-ID')}).
5. Jika sisa anggaran sudah kritis dan tidak bisa dipangkas lagi, sarankan opsi penghasilan tambahan yang realistis di area Cimahi - KBB (kuliner UMKM, gig economy jalur Gadobangkong-Cimahi-Bandung, jastip belanja, dsb).

DATA KEUANGAN PENGGUNA TERKINI:
- Target Anggaran Bulanan: Rp ${context.monthlyBudget.toLocaleString('id-ID')}
- Sisa Anggaran: Rp ${context.remainingBudget.toLocaleString('id-ID')}
- Hari ke-${context.currentDay} dari ${context.daysInMonth} hari (Sisa ${context.remainingDays} hari)
- Batas Limit Harian yang dialokasikan: Rp ${Math.round(context.dailyLimit).toLocaleString('id-ID')} / hari
- Pengeluaran Hari Ini: Rp ${context.todayExpense.toLocaleString('id-ID')} (${
    context.todayExpense > context.dailyLimit
      ? 'MELEBIHI LIMIT HARIAN!'
      : context.todayExpense >= context.dailyLimit * 0.8
      ? 'MENDEKATI LIMIT HARIAN'
      : 'Aman di bawah limit'
  })
- Kategori Pengeluaran Terbesar:
${Object.entries(context.categoriesBreakdown)
  .map(([cat, amt]) => `  • ${cat}: Rp ${amt.toLocaleString('id-ID')}`)
  .join('\n') || '  (Belum ada data)'}
- Riwayat Belanja Terakhir:
${context.recentTransactions
  .slice(0, 4)
  .map((t) => `  • [${t.date}] ${t.category}: Rp ${t.amount.toLocaleString('id-ID')} (${t.description})`)
  .join('\n') || '  (Belum ada data)'}

Gaya Komunikasi:
- Ramah, hangat, praktis, to the point.
- Gunakan Bahasa Indonesia yang natural (bisa sesekali menyapa Kang/Teh dengan sopan).
- Berikan angka estimasi harga riil di Cimahi dalam Rupiah (Rp).`;

  // Format messages into contents array
  const contents = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
      topP: 0.9,
    },
  });

  return response.text || 'Maaf, Kang Cuan AI sedang menyiapkan data. Coba tanyakan kembali ya!';
}

export async function generateBudgetAdvice(context: FinancialContext) {
  const model = 'gemini-3.8-flash';

  const systemInstruction = `Anda adalah "Kang Cuan AI", penasihat keuangan pribadi cerdas dan ramah yang sangat memahami kondisi ekonomi Indonesia terkini, khususnya wilayah Kota Cimahi dan Kabupaten Bandung Barat (KBB):
- KBB: Area Jl. Haji Ghofur, Wisata & Kawasan PakuHaji, Desa Cilame, Kecamatan Ngamprah (Kompleks Pemkab KBB, Gadobangkong), Tanimulya, hingga Padalarang.
- Kota Cimahi: Kelurahan Cipageran (Cimahi Utara), Cimahi Tengah (Gandawijaya, Sangkuriang, Pasar Atas Baru, Pasar Antri Baru), Cimahi Selatan (Kerkof, Leuwigajah, Baros), dan Cimindi.

Karakter Anda:
- Ramah, solutif, realistis, empatik, menggunakan Bahasa Indonesia yang akrab (bisa diselingi sapaan akrab khas Sunda/Jabar seperti 'Kang/Teh', 'Pasar Atas', 'Borma', 'Cilame', tanpa berlebihan).
- FOKUS UTAMA: Memastikan anggaran bulanan pengguna (30 hari) CUKUP dan tidak habis di tengah jalan.
- Memberikan strategi konkrit:
  1. ANALISIS KONDISI HARIAN vs 30 HARI: Evaluasi apakah sisa anggaran dibagi sisa hari (${context.remainingDays} hari lagi) aman atau kritis. Berikan batas limit harian yang rasional.
  2. SUBSTITUSI BAHAN POKOK LOKAL CIMAHI & KBB: Berikan alternatif belanja pangan cerdas yang jauh lebih murah tapi tetap bernutrisi tinggi (contoh: sayur mayur segar langsung di pedagang jalur Haji Ghofur & PakuHaji; tempe & tahu Cibuntu; substitusi daging sapi dengan ikan kembung/tongkol segar di Pasar Atas Baru Cimahi atau lapak ikan segar Cipageran).
  3. REKOMENDASI PROMO & TEMPAT BELANJA HEMAT: Sarankan tempat belanja hemat lokal terdekat:
     - Pasar Atas Baru, Pasar Antri Baru, Pasar Kaget Permata/Cilame Permai
     - Promo mingguan & JSM Super Indo Cimahi (Sangkuriang), Borma Toserba (Gandawijaya / Kerkof / Dakota)
     - Minimarket promo hemat sepanjang Jl. Haji Ghofur, Jl. Raya Cilame Ngamprah, & Cipageran
     - Warung Sembako Madura / Grosir terdekat untuk beras & gas melon 3kg.
  4. SOLUSI PENAMBAHAN PENGHASILAN (Jika anggaran sudah mepet/kritis): Sarankan opsi mencari pemasukan tambahan realistis di koridor Cimahi - Ngamprah - Padalarang KBB.
  5. PERINGATAN LIMIT: Tegur secara halus dan berikan langkah taktis jika pengeluaran hari ini sudah melebihi atau mendekati limit harian.

Format output yang rapi dan terstruktur dengan poin-poin jelas, actionable, dan angka estimasi penghematan dalam Rupiah (Rp).`;

  const promptText = `Berikut data keuangan pengguna saat ini:
- Target Anggaran Bulanan: Rp ${context.monthlyBudget.toLocaleString('id-ID')}
- Total Pemasukan Tercatat: Rp ${context.totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran Tercatat: Rp ${context.totalExpense.toLocaleString('id-ID')}
- Sisa Anggaran: Rp ${context.remainingBudget.toLocaleString('id-ID')}
- Hari saat ini: Hari ke-${context.currentDay} dari ${context.daysInMonth} hari (Sisa ${context.remainingDays} hari)
- Batas Limit Pengeluaran Harian: Rp ${context.dailyLimit.toLocaleString('id-ID')} / hari
- Pengeluaran Hari Ini: Rp ${context.todayExpense.toLocaleString('id-ID')} (${
    context.todayExpense > context.dailyLimit
      ? 'MELEBIHI LIMIT HARIAN! Perlu penyesuaian segera.'
      : context.todayExpense >= context.dailyLimit * 0.8
      ? 'MENDEKATI LIMIT HARIAN (>=80%). Hati-hati.'
      : 'Aman di bawah limit harian.'
  })
- Rincian Pengeluaran per Kategori:
${Object.entries(context.categoriesBreakdown)
  .map(([cat, amt]) => `  • ${cat}: Rp ${amt.toLocaleString('id-ID')}`)
  .join('\n') || '  (Belum ada data rincian)'}
- Transaksi Terakhir:
${context.recentTransactions
  .slice(0, 5)
  .map(
    (t) =>
      `  • [${t.date}] ${t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'} Rp ${t.amount.toLocaleString(
        'id-ID'
      )} (${t.category}) - ${t.description}`
  )
  .join('\n') || '  (Belum ada transaksi)'}

Pertanyaan/Kebutuhan Spesifik Pengguna: "${
    context.userPrompt || 'Berikan audit menyeluruh dan strategi terbaik agar uang saya cukup sampai hari ke-30 dengan tips belanja hemat di Cimahi.'
  }"

Tolong berikan:
1. Status Kesehatan Anggaran (Aman / Waspada / Kritis) & Pacing 30 Hari.
2. Tindakan Hari Ini (Evaluasi limit pengeluaran hari ini Rp ${context.todayExpense.toLocaleString('id-ID')} vs limit Rp ${context.dailyLimit.toLocaleString('id-ID')}).
3. 3 Rekomendasi Substitusi Pangan & Belanja Cerdas Cimahi (sebutkan nama pasar/toko lokal seperti Pasar Atas, Pasar Antri, Borma, Super Indo).
4. Trik Promo & Penghematan Mingguan.
5. Rekomendasi Penghasilan Tambahan (jika sisa harian minim).
6. Kalimat motivasi penutup.`;

  const response = await ai.models.generateContent({
    model,
    contents: promptText,
    config: {
      systemInstruction,
      temperature: 0.7,
      topP: 0.9,
    },
  });

  return response.text || 'Gagal menghasilkan saran anggaran dari Gemini AI.';
}
