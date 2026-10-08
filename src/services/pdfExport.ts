import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

export class ExportService {
  /**
   * Generates and downloads a clean, professional PDF financial report
   */
  static exportPDF(data: ReportData) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    // Header Title
    doc.setFillColor(16, 185, 129); // Emerald primary
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DOMPET PINTAR CIMAHI - LAPORAN KEUANGAN', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${data.config.month} | Wilayah Acuan: ${data.config.cityContext}`, 14, 18);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 23);

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
    doc.setFontSize(8);
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
    doc.setFontSize(8);
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
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('Total Pemasukan', 17 + (boxWidth + 3) * 2, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`Rp ${data.totalIncome.toLocaleString('id-ID')}`, 17 + (boxWidth + 3) * 2, y + 12);

    // Box 4: Sisa Anggaran & Limit
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14 + (boxWidth + 3) * 3, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text('Limit / Hari (30 Hari)', 17 + (boxWidth + 3) * 3, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text(`Rp ${Math.round(data.dailyStatus.dailyLimit).toLocaleString('id-ID')}`, 17 + (boxWidth + 3) * 3, y + 12);

    y += boxHeight + 8;

    // Pacing Status Banner
    const isOver = data.totalExpense > data.config.monthlyBudget;
    doc.setFillColor(isOver ? 254 : 240, isOver ? 226 : 253, isOver ? 226 : 244);
    doc.roundedRect(14, y, pageWidth - 28, 10, 1.5, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isOver ? 185 : 22, isOver ? 28 : 101, isOver ? 28 : 52);
    doc.text(
      `STATUS EVALUASI: ${isOver ? 'OVER BUDGET! Pengeluaran melebihi anggaran awal.' : 'ON TRACK! Anggaran terkendali.'} (Sisa ${data.dailyStatus.remainingDays} hari dari target 30 hari).`,
      17,
      y + 6.5
    );

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

    const topCategories = data.categories.slice(0, 6);
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

    const recentTx = data.transactions.slice(0, 18);
    recentTx.forEach((tx) => {
      if (y > 275) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`${tx.date} ${tx.time || ''}`, 17, y + 3.5);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(tx.type === 'expense' ? 185 : 4, tx.type === 'expense' ? 28 : 120, tx.type === 'expense' ? 28 : 87);
      doc.text(`${tx.type === 'expense' ? '-' : '+'} ${tx.category}`, 48, y + 3.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const desc = tx.description.length > 25 ? tx.description.substring(0, 25) + '...' : tx.description;
      doc.text(desc, 95, y + 3.5);
      doc.text(tx.paymentMethod, 145, y + 3.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Rp ${tx.amount.toLocaleString('id-ID')}`, 172, y + 3.5);

      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 4.8, pageWidth - 14, y + 4.8);
      y += 5.5;
    });

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.text('Dicetak otomatis oleh Dompet Pintar Cimahi | Terintegrasi dengan Google Sheets & Gemini AI', 14, 288);

    doc.save(`Laporan_Keuangan_Cimahi_${data.config.month}.pdf`);
  }

  /**
   * Captures visual DOM container and downloads as high-resolution PNG
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
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
