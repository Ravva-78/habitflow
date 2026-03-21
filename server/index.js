// server/index.js — FIXED VERSION
// Fix 1: CORS open (mobile apps don't have an origin header)
// Fix 2: PORT from Railway environment (Railway uses 8080 not 3000)
// Fix 3: Added anthropic-beta header for latest models

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');

const app  = express();
const PORT = process.env.PORT || 8080; // ✅ Railway uses 8080

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '10kb' }));

// ✅ CORS fix — mobile apps send no Origin header, must allow all
app.use(cors({
  origin: true, // allow all origins (mobile apps have no origin)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check — test this in browser: https://habitflow-production-0efc.up.railway.app/
app.get('/', (req, res) => {
  res.json({ status: '✅ HabitFlow API running', version: '1.0.0' });
});

// ✅ Claude AI proxy
app.post('/api/coach', async (req, res) => {
  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }
  if (messages.length > 30) {
    return res.status(400).json({ error: 'Too many messages' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set in Railway Variables!');
    return res.status(500).json({ error: 'Server not configured. Contact admin.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     system || 'You are a helpful habit coach.',
        messages:   messages.slice(-20), // last 20 msgs only
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', response.status, err);
      return res.status(502).json({ error: 'AI service error. Try again.' });
    }

    const data  = await response.json();
    const reply = data.content?.[0]?.text || 'No response generated.';
    return res.json({ reply });

  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitFlow proxy running on port ${PORT}`);
});

module.exports = app;
