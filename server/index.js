const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// origin:true mirrors back whatever Origin header the client sends.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/coach', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const systemInstruction = systemPrompt || 
      'You are HabitFlow\'s AI Coach — a warm, motivating habit coach for students. ' +
      'Keep responses concise (under 200 words), use bullet points, and be direct. ' +
      'Always use relevant emojis. Focus on building consistency.';

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    });

    // Convert our role format to Gemini's role format
    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Extract the latest user message from the end of the array
    const userMessage = history.pop(); 

    // Start a chat session with the previous history
    const chat = model.startChat({
      history: history,
    });

    // Send the latest message to the model
    const result = await chat.sendMessage(userMessage.parts);
    const responseText = result.response.text();

    res.json({ reply: responseText });

  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({
      error: 'AI Coach temporarily unavailable',
      detail: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
