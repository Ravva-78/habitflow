// server/index.js
// HabitFlow API Proxy Server
// Deploy this on Railway / Render / Vercel (free tier)
// This keeps your Anthropic API key SAFE on the server — never in the app

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ──
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks

// ── CORS — only allow your app ──
app.use(cors({
  origin: [
    'http://localhost:8081',           // local dev
    'http://localhost:19006',          // expo web
    'exp://localhost:8081',            // expo go
    // Add your production domain here when you have one
  ],
  methods: ['POST'],
}));

// ── Rate limiting — prevent API abuse ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // max 30 requests per 15 min per IP
  message: { error: 'Too many requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ status: 'HabitFlow API proxy running ✅', version: '1.0.0' });
});

// ── Claude AI proxy endpoint ──
app.post('/api/coach', async (req, res) => {
  const { messages, system } = req.body;

  // Validate input
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }
  if (messages.length > 20) {
    return res.status(400).json({ error: 'Too many messages in history' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':            'application/json',
        'x-api-key':               process.env.ANTHROPIC_API_KEY, // ✅ safe on server
        'anthropic-version':       '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     system || 'You are a helpful habit coach.',
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(response.status).json({ error: 'AI service error. Try again.' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, no response generated.';
    res.json({ reply });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`HabitFlow proxy server running on port ${PORT}`);
});

module.exports = app;
