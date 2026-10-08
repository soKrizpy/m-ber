import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateBudgetAdvice, chatBudgetAdvisor, generateDailySmartTips, FinancialContext } from './api/geminiAdvisor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

// Serve static frontend assets from dist in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server Dompet Pintar Cimahi running on port ${PORT}`);
});
