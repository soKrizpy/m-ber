import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateBudgetAdvice,
  chatBudgetAdvisor,
  generateDailySmartTips,
  generateSmartShoppingList,
  type FinancialContext,
} from './api/geminiAdvisor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run sets PORT=8080 for NGINX; the Node dev server must always listen on port 3000
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'M-Ber (Dompet Pintar Cimahi)',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API endpoint for Gemini Smart Shopping List
app.post('/api/gemini/smart-shopping-list', async (req, res) => {
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

// API endpoint for Gemini Daily Smart Tips
app.post('/api/gemini/daily-tips', async (req, res) => {
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

// API endpoint for Gemini Budget Chatbot
app.post('/api/gemini/chat', async (req, res) => {
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

// API endpoint for Gemini Budget Advice
app.post('/api/gemini/advisor', async (req, res) => {
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

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static frontend assets from dist in production
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));

  // Fallback to index.html for SPA
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server Dompet Pintar Cimahi running on port ${PORT}`);
});
