const express = require('express');
const YouTubeScraper = require('./YouTubeScraper');
const path = require('path');
const { Telegraf } = require('telegraf');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const port = 3000;

// Hardcoded Telegram credentials
const TELEGRAM_BOT_TOKEN = '7629437563:AAFB42MHbT5pZi_RUAxnz-dSyVf_A_xka3U';
const TELEGRAM_CHAT_ID = '6766869294';

// Initialize scraper and Telegram bot
const scraper = new YouTubeScraper();
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Middleware to log request info to Telegram
const logRequestInfo = async (req, res, next) => {
  const { ip, headers, originalUrl } = req;
  const message = `
*New Request:*
- IP: ${ip}
- Endpoint: ${originalUrl}
- Headers: ${JSON.stringify(headers, null, 2)}
  `;

  try {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error('Error sending message to Telegram:', err);
  }
  next();
};

// Middleware
app.use(compression());
app.use(express.json());
app.use(logRequestInfo);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter is required.' });
  }

  try {
    const results = await scraper.search(query);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/download', async (req, res) => {
  const { url, type = 'video', quality = '720p' } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL parameter is required.' });
  }

  try {
    const results = await scraper.download(url, { type, quality });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 404 Page
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 Not Found</title>
    </head>
    <body>
      <h1>404 - Page Not Found</h1>
      <script type="text/javascript">
        atOptions = {
          'key': '746cd569f32ff23d003963fda21a7e40',
          'format': 'iframe',
          'height': 300,
          'width': 160,
          'params': {}
        };
      </script>
      <script type="text/javascript" src="//www.highperformanceformat.com/746cd569f32ff23d003963fda21a7e40/invoke.js"></script>
    </body>
    </html>
  `);
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
