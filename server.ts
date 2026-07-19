import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for the Gemini Chat Assistant
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, username } = req.body;
      const finalUsername = username || 'Rabia';
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in environment variables. Please check Settings > Secrets.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Map chat history to match standard structure
      const formattedHistory = (history || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are the BidBattle AI Assistant. BidBattle is a premium, high-frequency online auction platform.
Key details about BidBattle:
- Our core features include real-time simulated bidding battles on ultra-exclusive luxury lots (Rolex watches, abstract art, supercars, historic assets).
- Digital Wallet with top-ups and interactive PK payment integration (JazzCash, EasyPaisa, Premium Credit Card).
- Double physical expert authenticity inspection certificates.
- DHL Luxury Air Express cargo shipping with live end-to-end status tracking.
- The user's name is ${finalUsername}. Always address them warmly, politely, and professionally.
- Format responses beautifully with markdown and maintain a prestigious, sophisticated concierge tone. Keep replies concise and focused. Do not mention any code or server-side details.`,
        }
      });

      return res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      return res.status(500).json({ error: err.message || 'An error occurred with the AI assistant.' });
    }
  });

  // Serve static files / mount Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BidBattle server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BidBattle server:', err);
});
