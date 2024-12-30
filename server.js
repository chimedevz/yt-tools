const express = require('express');
const YouTubeScraper = require('./YouTubeScraper'); // Pastikan Anda menyimpan kelas sebelumnya di file terpisah
const path = require('path');
const app = express();
const port = 3000;

const scraper = new YouTubeScraper();

// Middleware untuk format JSON terformat
app.set('json spaces', 2);

// Endpoint untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint untuk pencarian video di YouTube
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

// Endpoint untuk mendownload video atau audio dari YouTube
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

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});