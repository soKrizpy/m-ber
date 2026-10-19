import express from 'express';
import dotenv from 'dotenv';
import {
  generateBudgetAdvice,
  chatBudgetAdvisor,
  generateDailySmartTips,
  generateSmartShoppingList,
  type FinancialContext,
} from './geminiAdvisor.ts';

dotenv.config();

const app = express();
app.use(express.json());

// Support both /api/health and /health
const healthHandler: express.RequestHandler = (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'M-Ber (Dompet Pintar Cimahi)',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Helper to attach routes to both /api/gemini/... and /gemini/... for seamless Vercel rewrites
const registerGeminiRoutes = (prefix: string) => {
  // Smart Shopping List
  app.post(`${prefix}/smart-shopping-list`, async (req, res) => {
    try {
      const { context, userPreference } = req.body;
      const shoppingPlan = await generateSmartShoppingList(context || {}, userPreference);
      res.json({ success: true, plan: shoppingPlan });
    } catch (error: any) {
      console.error('Error generating smart shopping list:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Gagal memproses daftar belanja cerdas.',
      });
    }
  });

  // Daily Smart Tips
  app.post(`${prefix}/daily-tips`, async (req, res) => {
    try {
      const context: FinancialContext = req.body;
      const tips = await generateDailySmartTips(context);
      res.json({ success: true, tips });
    } catch (error: any) {
      console.error('Error generating daily tips:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Gagal memproses tips harian.',
      });
    }
  });

  // Budget Chatbot (Kang Tambal)
  app.post(`${prefix}/chat`, async (req, res) => {
    try {
      const { messages, context } = req.body;
      const reply = await chatBudgetAdvisor(messages || [], context || {});
      res.json({ success: true, reply });
    } catch (error: any) {
      console.error('Error in budget chatbot:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Gagal memproses percakapan chatbot.',
      });
    }
  });

  // Budget Advice
  app.post(`${prefix}/advisor`, async (req, res) => {
    try {
      const context: FinancialContext = req.body;
      const advice = await generateBudgetAdvice(context);
      res.json({ success: true, advice });
    } catch (error: any) {
      console.error('Error generating budget advice:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Gagal memproses saran anggaran.',
      });
    }
  });
};

registerGeminiRoutes('/api/gemini');
registerGeminiRoutes('/gemini');

export default app;
