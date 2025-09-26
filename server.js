import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { message, lang } = req.body;
    const translatedIn = await translateText(message, "en");

    const chatbaseReply = await axios.post(
      "https://www.chatbase.co/api/v1/chat",
      {
        chatbotId: process.env.CHATBASE_BOT_ID,
        messages: [{ content: translatedIn, role: "user" }]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const botAnswer = chatbaseReply.data.output;
    const translatedOut = await translateText(botAnswer, lang);
    res.json({ reply: translatedOut });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gabim në server" });
  }
});

async function translateText(text, toLang) {
  const response = await axios.post(
    `${process.env.TRANSLATE_ENDPOINT}/translate?api-version=3.0&to=${toLang}`,
    [{ text }],
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.TRANSLATE_KEY,
        "Ocp-Apim-Subscription-Region": process.env.TRANSLATE_REGION,
        "Content-type": "application/json"
      }
    }
  );
  return response.data[0].translations[0].text;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveri po ecën në portën ${PORT}`));