const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

// Health check endpoint (Render e përdor për të parë nëse serveri është gjallë)
app.get('/', (req, res) => {
  res.send('✅ ALUSET Middleware is running');
});

// Endpoint kryesor për chatbot
app.post('/chat', async (req, res) => {
  try {
    const { message, lang } = req.body;

    // 1. Përkthe mesazhin në anglisht për Chatbase
    const translateResponse = await fetch(`${process.env.TRANSLATE_ENDPOINT}/translate?api-version=3.0&to=en`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.TRANSLATE_KEY,
        'Ocp-Apim-Subscription-Region': process.env.TRANSLATE_REGION,
        'Content-type': 'application/json'
      },
      body: JSON.stringify([{ Text: message }])
    });

    const translated = await translateResponse.json();
    const translatedMessage = translated[0].translations[0].text;

    // 2. Dërgo mesazhin në Chatbase
    const chatbaseResponse = await fetch(`https://www.chatbase.co/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHATBASE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatbotId: process.env.CHATBASE_BOT_ID,
        messages: [{ content: translatedMessage, role: "user" }]
      })
    });

    const chatbaseData = await chatbaseResponse.json();
    const botReplyEnglish = chatbaseData.text || "No reply from Chatbase";

    // 3. Përkthe përgjigjen mbrapsht në gjuhën e përdoruesit
    const backTranslateResponse = await fetch(`${process.env.TRANSLATE_ENDPOINT}/translate?api-version=3.0&to=${lang}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.TRANSLATE_KEY,
        'Ocp-Apim-Subscription-Region': process.env.TRANSLATE_REGION,
        'Content-type': 'application/json'
      },
      body: JSON.stringify([{ Text: botReplyEnglish }])
    });

    const backTranslated = await backTranslateResponse.json();
    const botReplyFinal = backTranslated[0].translations[0].text;

    res.json({ reply: botReplyFinal });

  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 4. Konfigurimi për Render → përdor PORT + host 0.0.0.0
const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(port, host, () => {
  console.log(`🚀 Server running at http://${host}:${port}`);
});
