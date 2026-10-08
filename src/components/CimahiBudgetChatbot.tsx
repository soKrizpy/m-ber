import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  MapPin,
  Bot,
  User,
  ShoppingBag,
  Tag,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Store,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';
import {
  Transaction,
  BudgetConfig,
  DailyLimitStatus,
  CategorySummary,
} from '../types/finance.ts';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface CimahiBudgetChatbotProps {
  config: BudgetConfig;
  transactions: Transaction[];
  dailyStatus: DailyLimitStatus;
  totalIncome: number;
  totalExpense: number;
  remainingBudget: number;
  categories: CategorySummary[];
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const CHAT_STARTER_PROMPTS = [
  {
    icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />,
    label: 'Substitusi Pangan Lokal',
    text: 'Bahan pokok apa yang bisa saya substitusi dengan alternatif murah bergizi di Pasar Atas Baru atau pedagang lokal sepanjang jalur Jl. Haji Ghofur & PakuHaji?',
  },
  {
    icon: <Tag className="w-3.5 h-3.5 text-blue-500" />,
    label: 'Promo Supermarket & JSM',
    text: 'Cek promo belanja supermarket & diskon JSM di area Cimahi & KBB (Borma, Super Indo Sangkuriang, minimarket Haji Ghofur, Desa Cilame Ngamprah, & Cipageran). Barang apa yang paling hemat?',
  },
  {
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    label: 'Evaluasi Limit Hari Ini',
    text: 'Pengeluaran saya hari ini sudah tercatat. Apakah masih dalam batas aman limit harian atau perlu menghemat agar cukup sebulan?',
  },
  {
    icon: <CalendarCheck className="w-3.5 h-3.5 text-teal-500" />,
    label: 'Pacing Anggaran 30 Hari',
    text: 'Dengan sisa anggaran saya saat ini, tolong buatkan pembagian jatah belanja per minggu agar uang saya tidak habis sebelum akhir bulan.',
  },
  {
    icon: <Store className="w-3.5 h-3.5 text-indigo-500" />,
    label: 'Ide Cuan Cimahi - KBB',
    text: 'Jika saya sudah menghemat semaksimal mungkin tapi uang bulanan tetap mepet, apa opsi penghasilan tambahan yang realistis di koridor Cimahi, Ngamprah, dan Bandung Barat?',
  },
];

export const CimahiBudgetChatbot: React.FC<CimahiBudgetChatbotProps> = ({
  config,
  transactions,
  dailyStatus,
  totalIncome,
  totalExpense,
  remainingBudget,
  categories,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'model',
      text: `Sampurasun! Saya **Kang Tambal**, chatbot asisten keuangan Anda khusus wilayah **Kota Cimahi dan sekitarnya**.

📊 **Ringkasan Keuangan Anda Hari Ini:**
• **Sisa Anggaran 30 Hari:** Rp ${remainingBudget.toLocaleString('id-ID')} (Sisa ${dailyStatus.remainingDays} hari)
• **Limit Belanja Hari Ini:** Rp ${Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}
• **Pengeluaran Hari Ini:** Rp ${dailyStatus.todayExpense.toLocaleString('id-ID')} ${
        dailyStatus.todayExpense > dailyStatus.dailyLimit
          ? '⚠️ *(Melebihi limit harian!)*'
          : dailyStatus.todayExpense >= dailyStatus.dailyLimit * 0.8
          ? '⚠️ *(Mendekati batas 80%)*'
          : '✅ *(Masih aman)*'
      }

Ada yang ingin didiskusikan? Saya bisa bantu analisis belanja harian, carikan substitusi bahan pokok murah di Pasar Antri/Atas, tips promo diskon di Borma atau Super Indo, hingga taktik agar uang Anda cukup sebulan penuh!`,
      timestamp: Date.now(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    const categoriesBreakdown: Record<string, number> = {};
    categories.forEach((c) => {
      categoriesBreakdown[c.category] = c.amount;
    });

    try {
      const payload = {
        messages: newMessages.map((m) => ({
          role: m.role,
          text: m.text,
        })),
        context: {
          monthlyBudget: config.monthlyBudget,
          totalIncome,
          totalExpense,
          remainingBudget,
          daysInMonth: dailyStatus.daysInMonth,
          currentDay: dailyStatus.currentDay,
          remainingDays: dailyStatus.remainingDays,
          dailyLimit: dailyStatus.dailyLimit,
          todayExpense: dailyStatus.todayExpense,
          categoriesBreakdown,
          recentTransactions: transactions.slice(0, 6).map((t) => ({
            date: t.date,
            category: t.category,
            type: t.type,
            amount: t.amount,
            description: t.description,
          })),
          cityContext: config.cityContext,
        },
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            role: 'model',
            text: data.reply,
            timestamp: Date.now(),
          },
        ]);
      } else {
        throw new Error(data.error || 'Gagal memproses pesan');
      }
    } catch (err: any) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          role: 'model',
          text: `Aduh hapunten, koneksi ke server Kang Tambal terputus (${err.message || 'Error'}). Silakan coba tanyakan kembali ya!`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // If initial prompt provided (e.g. from Daily Tips card), auto-send
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      sendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: `Percakapan telah direset. Ada hal yang ingin Anda tanyakan seputar pengeluaran, harga pasar di Cimahi, atau tips belanja hemat hari ini?`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[750px] max-h-[85vh] overflow-hidden">
      {/* Chatbot Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-amber-300 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                Kang Tambal — Chatbot Anggaran Cimahi & KBB
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 text-emerald-200 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Cimahi & KBB (H. Ghofur, Cilame, Cipageran)
              </span>
            </div>
            <p className="text-[11px] text-emerald-100">
              Analisis belanja harian, substitusi pasar, promo supermarket KBB/Cimahi & ide cuan
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition"
          title="Reset Percakapan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Financial Indicator Ribbon */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <div className="flex items-center space-x-3">
          <span className="text-slate-500 dark:text-slate-400">
            Sisa Saldo: <strong className="text-emerald-600 dark:text-emerald-400">Rp {remainingBudget.toLocaleString('id-ID')}</strong>
          </span>
          <span>•</span>
          <span className="text-slate-500 dark:text-slate-400">
            Limit Hari Ini: <strong className="text-slate-900 dark:text-white">Rp {Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}</strong>
          </span>
          <span>•</span>
          <span className="text-slate-500 dark:text-slate-400">
            Terpakai: <strong className={dailyStatus.isOverBudget ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>
              Rp {dailyStatus.todayExpense.toLocaleString('id-ID')}
            </strong>
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
            dailyStatus.isOverBudget
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              : dailyStatus.isWarning
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
          }`}
        >
          {dailyStatus.isOverBudget ? 'Melebihi Limit' : dailyStatus.isWarning ? 'Mendekati Limit' : 'Kuota Aman'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((m) => {
          const isModel = m.role === 'model';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 sm:space-x-3 ${
                isModel ? 'justify-start' : 'justify-end'
              }`}
            >
              {isModel && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm space-y-1.5 shadow-xs relative group ${
                  isModel
                    ? 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-slate-800 dark:text-slate-200'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {/* Content */}
                <div className="whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>

                {/* Footer timestamp & copy */}
                <div
                  className={`flex items-center justify-between pt-1 text-[10px] ${
                    isModel ? 'text-slate-400' : 'text-emerald-100'
                  }`}
                >
                  <span>
                    {new Date(m.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {isModel && (
                    <button
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-emerald-600 flex items-center space-x-0.5"
                      title="Salin Pesan"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === m.id ? 'Disalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>
              </div>

              {!isModel && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Kang Tambal sedang menganalisis harga pasar Cimahi & data anggaran Anda...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      <div className="p-2 sm:px-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex space-x-2 pb-1 scrollbar-none">
          {CHAT_STARTER_PROMPTS.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => {
                const prompt =
                  starter.label === 'Evaluasi Limit Hari Ini'
                    ? `Pengeluaran saya hari ini sudah Rp ${dailyStatus.todayExpense.toLocaleString('id-ID')}. Batas harian saya Rp ${Math.round(dailyStatus.dailyLimit).toLocaleString('id-ID')}. Apakah masih aman atau perlu tips menghemat untuk besok?`
                    : starter.text;
                sendMessage(prompt);
              }}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition shrink-0 shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              {starter.icon}
              <span>{starter.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Field & Send Button */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputText);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tanyakan apa saja seputar belanja hemat Cimahi atau anggaran bulanan..."
            className="flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition active:scale-95 disabled:opacity-40 shadow-xs flex items-center space-x-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Kirim</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
