import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  Download,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  LineChart,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Transaction,
  BudgetConfig,
  DailyLimitStatus,
  CategorySummary,
} from '../types/finance.ts';
import { ExportService } from '../services/pdfExport.ts';

interface AnalyticsDashboardProps {
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  config,
  transactions,
  dailyStatus,
  totalIncome,
  totalExpense,
  remainingBudget,
  categories,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: number;
    amount: number;
    isProjected: boolean;
  } | null>(null);

  // 1. Calculate Daily Cumulative Spending & Linear Regression Projection for 30 days
  const regressionData = useMemo(() => {
    const daysInMonth = dailyStatus.daysInMonth || 30;
    const currentDay = Math.min(dailyStatus.currentDay || 1, daysInMonth);
    const monthPrefix = config.month;

    // Daily spending accumulator
    const dailyMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }

    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(monthPrefix))
      .forEach((t) => {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          const dayNum = parseInt(parts[2], 10);
          if (dayNum >= 1 && dayNum <= daysInMonth) {
            dailyMap[dayNum] = (dailyMap[dayNum] || 0) + t.amount;
          }
        }
      });

    // Actual cumulative series up to current day
    const actualCumulative: Array<{ day: number; cum: number; daily: number }> = [];
    let runningCum = 0;
    for (let d = 1; d <= currentDay; d++) {
      runningCum += dailyMap[d];
      actualCumulative.push({ day: d, cum: runningCum, daily: dailyMap[d] });
    }

    // Ordinary Least Squares (OLS) Linear Regression:
    // y = m * x + c, where x = day, y = cumulative spending
    let slope = 0;
    let intercept = 0;
    const n = actualCumulative.length;

    if (n >= 2) {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      for (let i = 0; i < n; i++) {
        const x = actualCumulative[i].day;
        const y = actualCumulative[i].cum;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }

      const meanX = sumX / n;
      const meanY = sumY / n;
      const ssXX = sumX2 - n * meanX * meanX;
      const ssXY = sumXY - n * meanX * meanY;

      slope = ssXX !== 0 ? ssXY / ssXX : runningCum / n;
      intercept = meanY - slope * meanX;

      // Cumulative spending cannot decrease over time, so clamp slope >= 0
      if (slope <= 0) {
        slope = runningCum / n;
        intercept = 0;
      }
    } else {
      slope = runningCum > 0 ? runningCum : config.monthlyBudget / daysInMonth;
      intercept = 0;
    }

    // Build full 30-day timeline with linear regression projection
    const fullTimeline: Array<{
      day: number;
      actualCum: number | null;
      projectedCum: number;
      isFuture: boolean;
    }> = [];

    const lastActualCum = runningCum;

    for (let d = 1; d <= daysInMonth; d++) {
      const isFuture = d > currentDay;
      const actualCum = !isFuture ? actualCumulative[d - 1]?.cum ?? lastActualCum : null;

      // Projected cumulative spending: from current day onwards, add slope * (d - currentDay)
      let projectedCum: number;
      if (d <= currentDay) {
        projectedCum = actualCum!;
      } else {
        projectedCum = Math.round(lastActualCum + slope * (d - currentDay));
      }

      fullTimeline.push({
        day: d,
        actualCum,
        projectedCum,
        isFuture,
      });
    }

    const projectedEndTotal = fullTimeline[daysInMonth - 1]?.projectedCum || runningCum;
    const budgetVariance = config.monthlyBudget - projectedEndTotal;
    const isOverBudgetProjected = projectedEndTotal > config.monthlyBudget;
    const targetBurnRate =
      daysInMonth - currentDay > 0
        ? Math.max(0, (config.monthlyBudget - lastActualCum) / (daysInMonth - currentDay))
        : 0;

    return {
      daysInMonth,
      currentDay,
      actualCumulative,
      fullTimeline,
      lastActualCum,
      slope: Math.round(slope),
      projectedEndTotal,
      budgetVariance,
      isOverBudgetProjected,
      targetBurnRate: Math.round(targetBurnRate),
    };
  }, [transactions, config, dailyStatus]);

  // Chart coordinates calculation
  const svgWidth = 660;
  const svgHeight = 270;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const yMax = Math.max(
    config.monthlyBudget * 1.15,
    regressionData.projectedEndTotal * 1.12,
    regressionData.lastActualCum * 1.25,
    1000000
  );

  const getX = (day: number) => {
    return padLeft + ((day - 1) / (regressionData.daysInMonth - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padTop + plotHeight - (val / yMax) * plotHeight;
  };

  // SVG Paths
  // 1. Actual Historical Line & Gradient Area
  const actualPoints = regressionData.fullTimeline
    .filter((p) => !p.isFuture)
    .map((p) => `${getX(p.day)},${getY(p.actualCum!)}`);

  const actualLinePath = actualPoints.length > 0 ? `M ${actualPoints.join(' L ')}` : '';
  const actualAreaPath =
    actualPoints.length > 0
      ? `M ${getX(1)},${getY(0)} L ${actualPoints.join(' L ')} L ${getX(
          regressionData.currentDay
        )},${getY(0)} Z`
      : '';

  // 2. Projected Future Line
  const projectedPoints = regressionData.fullTimeline
    .filter((p) => p.day >= regressionData.currentDay)
    .map((p) => `${getX(p.day)},${getY(p.projectedCum)}`);

  const projectedLinePath = projectedPoints.length > 0 ? `M ${projectedPoints.join(' L ')}` : '';

  // 3. Horizontal Budget Line Y
  const budgetY = getY(config.monthlyBudget);

  // SVG Donut Math
  const totalCategoryExpense = categories.reduce((sum, c) => sum + c.amount, 0) || 1;
  let cumulativeAngle = 0;
  const donutRadius = 60;
  const donutCx = 80;
  const donutCy = 80;

  const donutSlices = categories.map((cat) => {
    const sliceAngle = (cat.amount / totalCategoryExpense) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = donutCx + donutRadius * Math.cos(startRad);
    const y1 = donutCy + donutRadius * Math.sin(startRad);
    const x2 = donutCx + donutRadius * Math.cos(endRad);
    const y2 = donutCy + donutRadius * Math.sin(endRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    const pathData = `M ${donutCx} ${donutCy} L ${x1} ${y1} A ${donutRadius} ${donutRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...cat,
      pathData,
    };
  });

  const handleExportPDF = () => {
    ExportService.exportPDF({
      config,
      transactions,
      dailyStatus,
      totalIncome,
      totalExpense,
      remainingBudget,
      categories,
    });
  };

  const handleExportPNG = async () => {
    await ExportService.exportPNG('visual-summary-card', `Dompet_Cimahi_${config.month}.png`);
  };

  return (
    <div className="space-y-6">
      {/* Visual Summary Card to Export */}
      <div
        id="visual-summary-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6"
      >
        {/* Card Header & Export Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Laporan Keuangan & Proyeksi Tren
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {config.cityContext}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Dasbor Analitik & Prediksi Pengeluaran
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPNG}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Unduh sebagai gambar PNG untuk dibagikan"
            >
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Simpan Gambar PNG</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              title="Unduh laporan lengkap format PDF"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Target Anggaran</p>
            <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white">
              Rp {config.monthlyBudget.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400">Total alokasi 30 hari</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
            <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Pengeluaran Riil Saat Ini</p>
            <p className="text-sm sm:text-lg font-black text-rose-700 dark:text-rose-300">
              Rp {regressionData.lastActualCum.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-rose-500/80">
              Hari ke-{regressionData.currentDay} dari 30 hari
            </p>
          </div>

          <div className={`p-4 rounded-2xl border space-y-1 ${
            regressionData.isOverBudgetProjected
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60'
              : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60'
          }`}>
            <p className={`text-[11px] font-medium ${
              regressionData.isOverBudgetProjected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              Proyeksi Akhir Bulan (Hari 30)
            </p>
            <p className={`text-sm sm:text-lg font-black ${
              regressionData.isOverBudgetProjected ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              Rp {regressionData.projectedEndTotal.toLocaleString('id-ID')}
            </p>
            <p className={`text-[10px] font-semibold ${
              regressionData.isOverBudgetProjected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {regressionData.isOverBudgetProjected
                ? `Defisit Rp ${Math.abs(regressionData.budgetVariance).toLocaleString('id-ID')}`
                : `Sisa Hemat Rp ${regressionData.budgetVariance.toLocaleString('id-ID')}`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
            <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Laju Belanja Linier (Slope)</p>
            <p className="text-sm sm:text-lg font-black text-blue-700 dark:text-blue-300">
              Rp {regressionData.slope.toLocaleString('id-ID')} <span className="text-xs font-normal">/hari</span>
            </p>
            <p className="text-[10px] text-blue-500/80">
              Target aman: Rp {regressionData.targetBurnRate.toLocaleString('id-ID')}/hari
            </p>
          </div>
        </div>

        {/* FEATURE 1: FUTURE SPENDING PROJECTION CHART (LINEAR REGRESSION) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Grafik Proyeksi Pengeluaran (Linear Regression)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Simulasi tren akumulasi belanja harian hingga hari ke-30 berdasarkan regresi kuadrat terkecil (OLS)
                </p>
              </div>
            </div>

            {/* Legend badges */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" />
                <span>Realisasi (s/d Hari {regressionData.currentDay})</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-500 dark:text-rose-400 font-semibold">
                <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block" />
                <span>Proyeksi Tren Linier</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-500 font-semibold">
                <span className="w-3 h-0.5 border-t border-dotted border-amber-500 inline-block" />
                <span>Target Budget</span>
              </span>
            </div>
          </div>

          {/* SVG Interactive Chart Canvas */}
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[580px] select-none"
            >
              <defs>
                {/* Gradient for actual cumulative area */}
                <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                {/* Gradient for projected future area */}
                <linearGradient id="projectedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={regressionData.isOverBudgetProjected ? '#f43f5e' : '#10b981'} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={regressionData.isOverBudgetProjected ? '#f43f5e' : '#10b981'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const yVal = pct * yMax;
                const yCoord = getY(yVal);
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={yCoord}
                      x2={svgWidth - padRight}
                      y2={yCoord}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={padLeft - 8}
                      y={yCoord + 3.5}
                      textAnchor="end"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      Rp {Math.round(yVal / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Vertical day markers (X-axis) */}
              {[1, 5, 10, 15, 20, 25, 30].map((d) => {
                const xCoord = getX(d);
                return (
                  <g key={d}>
                    <line
                      x1={xCoord}
                      y1={padTop}
                      x2={xCoord}
                      y2={padTop + plotHeight}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/80"
                    />
                    <text
                      x={xCoord}
                      y={padTop + plotHeight + 16}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      H-{d}
                    </text>
                  </g>
                );
              })}

              {/* Budget Cap Horizontal Line */}
              <line
                x1={padLeft}
                y1={budgetY}
                x2={svgWidth - padRight}
                y2={budgetY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="6,4"
              />
              <text
                x={svgWidth - padRight - 4}
                y={budgetY - 5}
                textAnchor="end"
                className="text-[9.5px] fill-amber-500 font-bold"
              >
                Batas Target Rp {config.monthlyBudget.toLocaleString('id-ID')}
              </text>

              {/* 1. Actual Historical Fill & Stroke */}
              {actualAreaPath && (
                <path d={actualAreaPath} fill="url(#actualAreaGradient)" />
              )}
              {actualLinePath && (
                <path
                  d={actualLinePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* 2. Projected Linear Regression Path */}
              {projectedLinePath && (
                <path
                  d={projectedLinePath}
                  fill="none"
                  stroke={regressionData.isOverBudgetProjected ? '#f43f5e' : '#14b8a6'}
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                />
              )}

              {/* 3. Today's Vertical Marker */}
              <line
                x1={getX(regressionData.currentDay)}
                y1={padTop}
                x2={getX(regressionData.currentDay)}
                y2={padTop + plotHeight}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <rect
                x={getX(regressionData.currentDay) - 24}
                y={padTop - 18}
                width="48"
                height="15"
                rx="4"
                fill="#06b6d4"
              />
              <text
                x={getX(regressionData.currentDay)}
                y={padTop - 7.5}
                textAnchor="middle"
                className="text-[8.5px] fill-white font-bold"
              >
                Hari Ini
              </text>

              {/* Data points for actual days */}
              {regressionData.actualCumulative.map((item) => (
                <circle
                  key={item.day}
                  cx={getX(item.day)}
                  cy={getY(item.cum)}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      day: item.day,
                      amount: item.cum,
                      isProjected: false,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Day 30 Finish Line Projection Node */}
              <circle
                cx={getX(regressionData.daysInMonth)}
                cy={getY(regressionData.projectedEndTotal)}
                r="5"
                fill={regressionData.isOverBudgetProjected ? '#f43f5e' : '#10b981'}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="cursor-pointer animate-pulse"
                onMouseEnter={() =>
                  setHoveredPoint({
                    day: regressionData.daysInMonth,
                    amount: regressionData.projectedEndTotal,
                    isProjected: true,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </svg>

            {/* Interactive Tooltip Hover */}
            {hoveredPoint && (
              <div className="absolute top-2 left-16 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs shadow-lg space-y-0.5 border border-slate-700 pointer-events-none animate-in fade-in">
                <p className="font-bold">
                  {hoveredPoint.isProjected ? '🔮 Proyeksi' : '📌 Realisasi'} Hari ke-{hoveredPoint.day}
                </p>
                <p className="text-emerald-400 font-mono">
                  Akumulasi: Rp {hoveredPoint.amount.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>

          {/* Statistical Insight Callout Box */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 ${
              regressionData.isOverBudgetProjected
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold">
              {regressionData.isOverBudgetProjected ? (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span>
                {regressionData.isOverBudgetProjected
                  ? 'Peringatan Tren Linier: Pengeluaran Diprediksi Melebihi Anggaran!'
                  : 'Tren Linier Terkendali: Pengeluaran Diprediksi Mencukupi 30 Hari!'}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed">
              Berdasarkan pola regresi linier saat ini, laju belanja harian Anda berjalan di angka{' '}
              <strong>Rp {regressionData.slope.toLocaleString('id-ID')}/hari</strong>. Jika ritme ini tidak disesuaikan, total pengeluaran di akhir bulan (hari ke-30) diproyeksikan mencapai{' '}
              <strong>Rp {regressionData.projectedEndTotal.toLocaleString('id-ID')}</strong> (
              {regressionData.isOverBudgetProjected
                ? `melewati batas anggaran sebesar Rp ${Math.abs(regressionData.budgetVariance).toLocaleString('id-ID')}`
                : `tersisa surplus hemat sebesar Rp ${regressionData.budgetVariance.toLocaleString('id-ID')}`}
              ).
            </p>

            {regressionData.isOverBudgetProjected && regressionData.targetBurnRate < regressionData.slope && (
              <div className="pt-1 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center space-x-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Saran Penyesuaian: Tekan belanja harian Anda sebesar Rp{' '}
                  {(regressionData.slope - regressionData.targetBurnRate).toLocaleString('id-ID')}/hari (maksimal Rp{' '}
                  {regressionData.targetBurnRate.toLocaleString('id-ID')}/hari) agar anggaran cukup sampai hari ke-30.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Category Donut Breakdown & 10-day Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Donut Chart */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Porsi Pengeluaran per Kategori
              </h3>
            </div>

            {categories.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                Belum ada data pengeluaran bulan ini
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="relative w-36 h-36 shrink-0">
                  <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                    {donutSlices.map((slice, idx) => (
                      <path
                        key={idx}
                        d={slice.pathData}
                        fill={slice.color}
                        className="hover:opacity-85 transition cursor-pointer"
                      />
                    ))}
                    <circle cx="80" cy="80" r="38" className="fill-white dark:fill-slate-900" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 font-medium">Pengeluaran</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {categories.length} Pos
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 w-full text-xs">
                  {categories.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {cat.category}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0 ml-2">
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 10-day Daily Spend Bar Chart */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Pengeluaran 10 Hari Terakhir
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Batas Harian: Rp {Math.round(dailyStatus.dailyLimit / 1000)}k
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              {Array.from({ length: 10 }).map((_, idx) => {
                const dayIndex = 9 - idx;
                const d = new Date();
                d.setDate(d.getDate() - dayIndex);
                const dateStr = d.toISOString().split('T')[0];
                const amt = transactions
                  .filter((t) => t.type === 'expense' && t.date === dateStr)
                  .reduce((sum, t) => sum + t.amount, 0);

                const maxBar = Math.max(dailyStatus.dailyLimit * 1.5, 100000);
                const heightPercent = Math.min(100, Math.max(6, (amt / maxBar) * 100));
                const isOver = amt > dailyStatus.dailyLimit;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 px-2 py-1 rounded bg-slate-900 text-white text-[10px] pointer-events-none whitespace-nowrap z-20">
                      Rp {amt.toLocaleString('id-ID')}
                    </div>
                    <div className="w-full max-w-[28px] bg-slate-200 dark:bg-slate-700 rounded-t-lg h-32 flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {d.getDate()}/{d.getMonth() + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
