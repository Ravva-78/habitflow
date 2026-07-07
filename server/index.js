const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();

// origin:true mirrors back whatever Origin header the client sends.
// Required for React Native apps where origin is null or file://
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check — used to confirm server is alive after deploy
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Coach endpoint
app.post('/api/coach', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt ||
        'You are HabitFlow\'s AI Coach — a warm, motivating habit coach for students. ' +
        'Keep responses concise (2-4 sentences) and actionable.',
      messages,
    });

    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    res.json({ reply });

  } catch (err) {
    console.error('Anthropic error:', err.message);
    res.status(500).json({
      error: 'AI Coach temporarily unavailable',
      detail: err.message,
    });
  }
});

// Render injects PORT automatically. Falls back to 3000 for local dev.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HabitFlow backend on port ${PORT}`));
