const express = require('express');
const YouTubeScraper = require('./YouTubeScraper');
const path = require('path');
const axios = require('axios');
const { Telegraf } = require('telegraf');
const app = express();
const port = 3000;

const scraper = new YouTubeScraper();
const telegramBotToken = '7629437563:AAFB42MHbT5pZi_RUAxnz-dSyVf_A_xka3U';
const chatId = '6766869294';

const bot = new Telegraf(telegramBotToken);

const escapeMarkdownV2 = (text) => {
  return text
    .replace(/([_\*[\]()~`>#+\-=|{}.!])/g, '\\$1')  // Escape markdown special characters
    .replace(/\n/g, '\\n');  // Escape newlines
};

const logRequestInfo = async (req) => {
  const { ip, headers, originalUrl } = req;
  const message = `
    *New Request Details:*
    - IP Address: ${ip}
    - Headers: ${JSON.stringify(headers, null, 2)}
    - Accessed Endpoint: ${originalUrl}
  `;

  try {
    const escapedMessage = escapeMarkdownV2(message);  // Escape special characters
    await bot.telegram.sendMessage(chatId, escapedMessage, { parse_mode: 'MarkdownV2' });
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
  }
};

app.set('json spaces', 2);


app.use(async (req, res, next) => {
  await logRequestInfo(req);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter diperlukan. Contoh: ?query=lagu',
    });
  }

  try {
    const result = await scraper.search(query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get('/download', async (req, res) => {
  const { url, type = 'video', quality = '720p' } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL parameter diperlukan. Contoh: ?url=https://youtube.com/watch?v=ID_VIDEO',
    });
  }

  try {
    const result = await scraper.download(url, { type, quality });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
