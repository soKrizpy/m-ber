import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Transaction, BudgetConfig, DailyLimitStatus, CategorySummary } from '../types/finance.ts';

export interface ReportData {
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
}

interface EfficiencyTipCategory {
  title: string;
  badge: string;
  badgeColor: [number, number, number]; // RGB
  cardBg: [number, number, number]; // RGB
  accentColor: [number, number, number]; // RGB
  tips: {
    headline: string;
    description: string;
  }[];
}

const EFFICIENCY_TIPS: EfficiencyTipCategory[] = [
  {
    title: '1. SENI DAPUR SEHAT & KREASI PANGAN BERGIZI KELUARGA',
    badge: 'GIZI PRIMA & HARMONI DAPUR',
    badgeColor: [16, 185, 129], // emerald
    cardBg: [240, 253, 244], // light emerald
    accentColor: [5, 150, 105],
    tips: [
      {
        headline: 'Perencanaan Menu Penuh Cinta (Weekly Meal Planning):',
        description:
          'Merancang jadwal hidangan mingguan bersama keluarga membuat belanja bahan segar lebih efisien, menjamin nutrisi seimbang, dan menyajikan masakan rumah lezat tanpa ada bahan yang terbuang.',
      },
      {
        headline: 'Eksplorasi Kesegaran Pasar Tradisional & Petani Lokal:',
        description:
          'Menikmati belanja sayuran segar, bumbu rempah alami, dan aneka lauk langsung di pasar tradisional. Kualitasnya lebih segar alami, harga jauh lebih ramah, sekaligus menggerakkan ekonomi lokal.',
      },
      {
        headline: 'Hangatnya Bekal Cinta & Kreasi Masakan Rumah:',
        description:
          'Menyiapkan bekal makanan rumah untuk aktivitas kantor atau sekolah menghadirkan rasa aman higienitas dan kesehatan pencernaan, sekaligus menjaga kelonggaran anggaran secara menyenangkan.',
      },
      {
        headline: 'Kombinasi Protein Unggulan & Superfood Nusantara:',
        description:
          'Memadukan protein hewani dengan superfood lokal seperti telur ayam segar, ikan kembung/tongkol kaya omega-3, tempe, tahu, dan aneka kacang-kacangan bernutrisi tinggi untuk daya tahan tubuh keluarga.',
      },
    ],
  },
  {
    title: '2. MEMBUKA PINTU REZEKI BARU & AKTUALISASI POTENSI KELUARGA',
    badge: 'KERAN REZEKI BERKAH',
    badgeColor: [79, 70, 229], // indigo
    cardBg: [238, 242, 255], // light indigo
    accentColor: [67, 56, 202],
    tips: [
      {
        headline: 'Optimalisasi Keterampilan & Passion Menjadi Nilai Tambah:',
        description:
          'Setiap talenta (kuliner, karya kreatif, edukasi anak, desain, hingga jasa konsultasi) dapat menjadi pintu rezeki sampingan yang mengalir saat ditekuni dengan bahagia di waktu luang.',
      },
      {
        headline: 'Berkah Decluttering & Rumah Lapang (Preloved Berkualitas):',
        description:
          'Menata kembali perlengkapan rumah, busana, atau buku yang masih sangat layak pakai. Rumah menjadi lebih lega dan lapang, sementara hasil penjualannya dapat memperkuat pos tabungan impian.',
      },
      {
        headline: 'Peluang Kemitraan Digital & Ekosistem Terpercaya:',
        description:
          'Memanfaatkan platform digital untuk memasarkan produk kebutuhan keluarga secara kemitraan/afiliasi etis yang fleksibel tanpa perlu beban modal besar.',
      },
    ],
  },
  {
    title: '3. QUALITY TIME BERMAKNA & SENI REKREASI BAHAGIA KELUARGA',
    badge: 'HEALING BERKUALITAS',
    badgeColor: [217, 119, 6], // amber
    cardBg: [254, 243, 199], // light amber
    accentColor: [180, 83, 9],
    tips: [
      {
        headline: 'Alokasi Khusus Bahagia Keluarga (Budgeted Fun):',
        description:
          'Keluarga berhak menikmati hiburan yang menyenangkan. Menyisihkan porsi anggaran rekreasi terencana di awal bulan membuat setiap momen liburan dapat dinikmati dengan tenang tanpa rasa cemas.',
      },
      {
        headline: 'Pesona Wisata Alam Bebas & Piknik Asri Terbuka:',
        description:
          'Menikmati keindahan ruang terbuka hijau, piknik santai di taman kota, bersepeda pagi, atau nonton film favorit bersama di rumah adalah momen kebersamaan mewah yang menyegarkan jiwa.',
      },
      {
        headline: 'Seni Menabung Impian untuk Liburan Istimewa:',
        description:
          'Untuk agenda liburan keluarga yang lebih besar, jadikan proses menabungnya sebagai proyek kebersamaan yang menyenangkan sehingga saat dinikmati terasa penuh rasa syukur dan bermakna.',
      },
    ],
  },
  {
    title: '4. KETENTERAMAN RUMAH TANGGA: MENJAGA PRIORITAS & KENYAMANAN HUNIAN',
    badge: 'KETENANGAN HATI',
    badgeColor: [225, 29, 72], // rose
    cardBg: [255, 241, 242], // light rose
    accentColor: [190, 18, 60],
    tips: [
      {
        headline: 'Menjaga Fondasi Kesejahteraan Keluarga:',
        description:
          'Mengutamakan pemenuhan kebutuhan esensial keluarga: hidangan bergizi seimbang, kenyamanan rumah tinggal & utilitas, serta perlindungan kesehatan untuk ketenangan hari esok.',
      },
      {
        headline: 'Penataan Layanan Berlangganan Digital Berkala:',
        description:
          'Mengecek berkala layanan hiburan atau aplikasi digital bersama pasangan. Pertahankan yang memberi manfaat nyata dan jeda langganan yang jarang dinikmati agar alokasi belanja lebih optimal.',
      },
      {
        headline: 'Kebutuhan Rumah Tangga Bersama (Smart Bulk Shopping):',
        description:
          'Mempersiapkan perlengkapan kebersihan dan kebutuhan rumah rutin dalam kemasan ekonomis bulanan di awal waktu untuk menjaga ketersediaan stok rumah tetap aman dan terkendali.',
      },
    ],
  },
  {
    title: '5. PONDASI MASA DEPAN SAKINAH: INVESTASI CINTA & KOMUNIKASI FINANSIAL',
    badge: 'RUMAH TANGGA HARMONIS',
    badgeColor: [13, 148, 136], // teal
    cardBg: [240, 253, 250], // light teal
    accentColor: [15, 118, 110],
    tips: [
      {
        headline: 'Prinsip Mengapresiasi Masa Depan (Pay Your Future First):',
        description:
          'Menyisihkan 10%-20% rezeki di awal penerimaan sebagai wujud syukur dan komitmen bersama untuk mewujudkan impian besar keluarga (pendidikan buah hati, hunian impian, hingga ibadah).',
      },
      {
        headline: 'Payung Perlindungan Dana Siaga Mandiri:',
        description:
          'Membangun dana cadangan keluarga secara bertahap memberikan ketenangan batin yang luar biasa, sehingga keluarga selalu siap dan tenang menghadapi berbagai kebutuhan tak terduga.',
      },
      {
        headline: "Momen Hangat 'Coffee & Finance' Bersama Pasangan:",
        description:
          'Menjadikan obrolan keuangan sebagai sesi apresiasi dan saling dukung 15 menit di akhir pekan sambil menikmati minuman favorit, merayakan capaian hemat, dan mempererat cinta.',
      },
    ],
  },
  {
    title: '6. HUNIAN RAMAH LINGKUNGAN & MOBILITAS NYAMAN KELUARGA',
    badge: 'ASRI & BERKELANJUTAN',
    badgeColor: [14, 116, 144], // cyan
    cardBg: [240, 249, 255], // light cyan
    accentColor: [8, 145, 178],
    tips: [
      {
        headline: 'Kenyamanan Energi Rumah yang Berkelanjutan:',
        description:
          'Memaksimalkan sirkulasi udara alami dan pencahayaan matahari segar di siang hari serta mematikan perangkat elektronik saat istirahat malam menciptakan hunian yang sejuk dan tagihan listrik yang ramah.',
      },
      {
        headline: 'Perawatan Kendaraan Keluarga Penuh Kehati-hatian:',
        description:
          'Rutin merawat motor atau mobil keluarga menjaga kenyamanan berkendara, keselamatan seluruh anggota keluarga, efisiensi bahan bakar, serta keawetan kendaraan dalam jangka panjang.',
      },
      {
        headline: 'Pilihan Mobilitas Ramah & Menyenangkan:',
        description:
          'Merancang rute perjalanan harian keluarga dengan cerdas serta menikmati moda transportasi publik lokal (seperti komuter kereta lokal atau angkutan trayek) untuk mobilitas bebas stres.',
      },
    ],
  },
];

export class ExportService {
  /**
   * Generates and downloads a clean, professional PDF financial report
   * includes complete spending breakdown and comprehensive efficiency tips
   */
  static exportPDF(data: ReportData) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 18;

    // ==========================================
    // PAGE 1: RINGKASAN KEUANGAN & ARUS KAS
    // ==========================================

    // Header Title
    doc.setFillColor(16, 185, 129); // Emerald primary
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('M-BER: LAPORAN HARMONI KEUANGAN KELUARGA', 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Periode: ${data.config.month} | Wilayah Acuan: ${data.config.cityContext || 'Cimahi & Sekitarnya'}`,
      14,
      18
    );
    doc.text(
      `Dicetak pada: ${new Date().toLocaleString('id-ID')} | Sahabat Perencanaan Finansial Rumah Tangga`,
      14,
      23
    );

    y = 36;

    // Summary Metric Boxes
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN ANGGARAN & ARUS KAS BULANAN', 14, y);
    y += 5;

    // 4 Box Metrics
    const boxWidth = (pageWidth - 28 - 9) / 4;
    const boxHeight = 18;

    // Box 1: Anggaran
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Target Anggaran', 17, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rp ${data.config.monthlyBudget.toLocaleString('id-ID')}`, 17, y + 12);

    // Box 2: Total Pengeluaran
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14 + boxWidth + 3, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(239, 68, 68);
    doc.text('Total Pengeluaran', 17 + boxWidth + 3, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`Rp ${data.totalExpense.toLocaleString('id-ID')}`, 17 + boxWidth + 3, y + 12);

    // Box 3: Total Pemasukan
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14 + (boxWidth + 3) * 2, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('Total Pemasukan', 17 + (boxWidth + 3) * 2, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`Rp ${data.totalIncome.toLocaleString('id-ID')}`, 17 + (boxWidth + 3) * 2, y + 12);

    // Box 4: Sisa Saldo / Limit Harian
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14 + (boxWidth + 3) * 3, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text('Sisa Anggaran', 17 + (boxWidth + 3) * 3, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text(`Rp ${data.remainingBudget.toLocaleString('id-ID')}`, 17 + (boxWidth + 3) * 3, y + 12);

    y += boxHeight + 8;

    // Pacing Status Banner
    const isOver = data.config.monthlyBudget > 0 && data.totalExpense > data.config.monthlyBudget;
    const isZeroBudget = data.config.monthlyBudget === 0;

    doc.setFillColor(isOver ? 254 : 240, isOver ? 243 : 253, isOver ? 199 : 244);
    doc.roundedRect(14, y, pageWidth - 28, 10, 1.5, 1.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isOver ? 180 : 22, isOver ? 83 : 101, isOver ? 9 : 52);

    let statusText = `CATATAN BIJAK: Luar biasa! Alokasi kebutuhan keluarga tertata rapi dan seimbang (Sisa ${data.dailyStatus.remainingDays} hari).`;
    if (isOver) {
      statusText = `CATATAN BIJAK: Arus kas bulan ini mengalami dinamika kebutuhan wajar. Mari diskusikan bersama pasangan dengan santai.`;
    } else if (isZeroBudget) {
      statusText = `CATATAN BIJAK: Lembaran baru keluarga sakinah (Saldo awal Rp 0). Mari tentukan impian dan alokasi bersama.`;
    }
    doc.text(statusText, 17, y + 6.5);

    y += 16;

    // Category Breakdown Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DISTRIBUSI PENGELUARAN PER KATEGORI', 14, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Kategori', 17, y + 4.2);
    doc.text('Jumlah Transaksi', 95, y + 4.2);
    doc.text('Total Nominal', 135, y + 4.2);
    doc.text('Porsi (%)', 172, y + 4.2);
    y += 7;

    const topCategories = data.categories.slice(0, 5);
    if (topCategories.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Belum ada transaksi pengeluaran tercatat untuk periode ini.', 17, y + 4);
      y += 7;
    } else {
      topCategories.forEach((cat) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(cat.category, 17, y + 4);
        doc.text(`${cat.count}x`, 95, y + 4);
        doc.text(`Rp ${cat.amount.toLocaleString('id-ID')}`, 135, y + 4);
        doc.text(`${cat.percentage.toFixed(1)}%`, 172, y + 4);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 5.5, pageWidth - 14, y + 5.5);
        y += 6;
      });
    }

    y += 6;

    // Transaction History Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RIWAYAT TRANSAKSI TERBARU', 14, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Tgl/Jam', 17, y + 4.2);
    doc.text('Jenis / Kategori', 48, y + 4.2);
    doc.text('Keterangan', 95, y + 4.2);
    doc.text('Metode', 145, y + 4.2);
    doc.text('Nominal (Rp)', 172, y + 4.2);
    y += 7;

    const recentTx = data.transactions.slice(0, 10);
    if (recentTx.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Belum ada transaksi yang dicatat. Saldo awal Rp 0.', 17, y + 4);
      y += 8;
    } else {
      recentTx.forEach((tx) => {
        if (y > 270) return; // Leave room for page footer

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`${tx.date} ${tx.time || ''}`, 17, y + 3.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(
          tx.type === 'expense' ? 185 : 4,
          tx.type === 'expense' ? 28 : 120,
          tx.type === 'expense' ? 28 : 87
        );
        doc.text(`${tx.type === 'expense' ? '-' : '+'} ${tx.category}`, 48, y + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const desc =
          tx.description.length > 25
            ? tx.description.substring(0, 25) + '...'
            : tx.description;
        doc.text(desc, 95, y + 3.5);
        doc.text(tx.paymentMethod, 145, y + 3.5);

        doc.setFont('helvetica', 'bold');
        doc.text(`Rp ${tx.amount.toLocaleString('id-ID')}`, 172, y + 3.5);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 4.8, pageWidth - 14, y + 4.8);
        y += 5.5;
      });
    }

    // ==========================================
    // PAGE 2: PANDUAN & TIPS STRATEGIS EFISIENSI
    // ==========================================
    doc.addPage();
    let p2Y = 0;

    // Header Page 2
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Emerald accent line
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 24, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN BIJAK PAKAR KEUANGAN: HARMONI FINANSIAL KELUARGA', 14, 11);

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(
      'Insight Mengayomi: Ketenangan Rumah Tangga, Gizi Berkualitas, Rekreasi Bahagia & Masa Depan Cerah',
      14,
      17
    );
    doc.text(
      'Disusun dengan empati sebagai sahabat perencanaan keuangan yang menenangkan bagi suami & istri',
      14,
      21
    );

    p2Y = 32;

    const cardWidth = pageWidth - 28; // 182 mm
    const leftMargin = 14;

    EFFICIENCY_TIPS.forEach((category) => {
      // Calculate dynamic height based on text wrapping
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');

      // Estimate height
      let contentHeight = 10; // title area
      category.tips.forEach((tip) => {
        const fullTipText = `• ${tip.headline} ${tip.description}`;
        const lines = doc.splitTextToSize(fullTipText, cardWidth - 10);
        contentHeight += lines.length * 3.8 + 1.5;
      });

      const cardHeight = Math.max(36, contentHeight + 4);

      // Check for page break if card exceeds current page boundary
      if (p2Y + cardHeight > 275) {
        doc.addPage();
        // Continuation Header
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, pageWidth, 16, 'F');
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 15, pageWidth, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('CATATAN BIJAK PAKAR KEUANGAN: HARMONI FINANSIAL KELUARGA (LANJUTAN)', 14, 10);
        p2Y = 22;
      }

      // Card Background
      doc.setFillColor(category.cardBg[0], category.cardBg[1], category.cardBg[2]);
      doc.roundedRect(leftMargin, p2Y, cardWidth, cardHeight, 2, 2, 'F');

      // Left Accent Strip
      doc.setFillColor(category.accentColor[0], category.accentColor[1], category.accentColor[2]);
      doc.roundedRect(leftMargin, p2Y, 2.5, cardHeight, 1, 1, 'F');

      // Category Title
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(category.accentColor[0], category.accentColor[1], category.accentColor[2]);
      doc.text(category.title, leftMargin + 5, p2Y + 5.5);

      // Pill Badge on right
      doc.setFillColor(category.badgeColor[0], category.badgeColor[1], category.badgeColor[2]);
      const badgeWidth = doc.getTextWidth(category.badge) + 4;
      doc.roundedRect(leftMargin + cardWidth - badgeWidth - 4, p2Y + 2.5, badgeWidth, 4.5, 1, 1, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(category.badge, leftMargin + cardWidth - badgeWidth - 2, p2Y + 5.7);

      // Render Tips inside Card
      let tipY = p2Y + 10;
      category.tips.forEach((tip) => {
        const fullTipText = `• ${tip.headline} ${tip.description}`;
        const lines = doc.splitTextToSize(fullTipText, cardWidth - 8);

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        // Draw lines
        lines.forEach((line: string, lineIdx: number) => {
          if (lineIdx === 0) {
            // First line has bullet
            doc.text(line, leftMargin + 5, tipY);
          } else {
            doc.text(line, leftMargin + 7, tipY);
          }
          tipY += 3.7;
        });
        tipY += 1.2;
      });

      p2Y += cardHeight + 4;
    });

    // Consistent Page Footers on all pages
    const totalPages = doc.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Halaman ${pageNum} dari ${totalPages} | M-Ber Family Financial Planner | Catatan Mengayomi untuk Ketenteraman Rumah Tangga`,
        14,
        288
      );
    }

    // Save document
    const fileName = `Laporan_Keuangan_MBer_${data.config.month}.pdf`;
    doc.save(fileName);
  }

  /**
   * Captures visual DOM container and downloads as high-resolution PNG
   * Sanitizes OKLCH colors and gradients for flawless cross-browser export
   */
  static async exportPNG(elementId: string, filename = 'Ringkasan_Keuangan_Cimahi.png') {
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`Elemen dengan ID #${elementId} tidak ditemukan.`);
    }

    const canvas = await html2canvas(el, {
      scale: 2, // High DPI
      useCORS: true,
      backgroundColor: null,
      onclone: (clonedDoc, clonedElement) => {
        try {
          const testCanvas = clonedDoc.createElement('canvas');
          testCanvas.width = 1;
          testCanvas.height = 1;
          const ctx = testCanvas.getContext('2d');

          const sanitizeColor = (str: string): string => {
            if (!str || typeof str !== 'string') return str;
            if (!str.includes('oklch') && !str.includes('oklab') && !str.includes('lch')) return str;
            return str.replace(/oklch\([^)]+\)/gi, (match) => {
              if (ctx) {
                try {
                  ctx.fillStyle = '#10b981';
                  ctx.fillStyle = match;
                  return ctx.fillStyle || '#10b981';
                } catch {
                  return '#10b981';
                }
              }
              return '#10b981';
            });
          };

          const elements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];
          for (const node of elements) {
            if (!node || !node.style) continue;
            const computed = window.getComputedStyle(node);
            if (computed.backgroundImage && computed.backgroundImage.includes('oklch')) {
              node.style.backgroundImage = sanitizeColor(computed.backgroundImage);
            }
            if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
              node.style.backgroundColor = sanitizeColor(computed.backgroundColor);
            }
            if (computed.color && computed.color.includes('oklch')) {
              node.style.color = sanitizeColor(computed.color);
            }
            if (computed.borderColor && computed.borderColor.includes('oklch')) {
              node.style.borderColor = sanitizeColor(computed.borderColor);
            }
          }
        } catch (e) {
          console.warn('html2canvas onclone sanitizer warning:', e);
        }
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
