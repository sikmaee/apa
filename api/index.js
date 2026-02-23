const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ message: "DP-API Active", usn: "sikmaee", repo: "simpanrx" });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
    const { provider } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'File tidak ditemukan' });

    try {
        if (provider === 'github') {
            const token = process.env.GITHUB_TOKEN;
            const repo = process.env.REPO_NAME; // sikmaee/simpanrx
            
            // Format nama file: tanggal-namaasli.ext
            const cleanFileName = req.file.originalname.replace(/\s+/g, '-').toLowerCase();
            const path = `uploads/${Date.now()}-${cleanFileName}`;
            const b64Content = req.file.buffer.toString('base64');

            const ghRes = await axios.put(
                `https://api.github.com/repos/${repo}/contents/${path}`,
                {
                    message: `Upload via DP-API Dashboard`,
                    content: b64Content
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json'
                    }
                }
            );

            // Menggunakan jsdelivr agar link gambar bisa langsung diakses/di-hotlink
            const rawUrl = `https://cdn.jsdelivr.net/gh/${repo}@main/${path}`;
            return res.json({ success: true, url: rawUrl });

        } else {
            // Jalur Catbox.moe
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', req.file.buffer, { filename: req.file.originalname });

            const catboxRes = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders()
            });

            return res.json({ success: true, url: catboxRes.data });
        }
    } catch (error) {
        console.error("Error Detail:", error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.message || 'Gagal mengunggah file' 
        });
    }
});

// Endpoint Jadwal Sholat
app.get('/api/prayer', async (req, res) => {
    try {
        const city = req.query.city || 'Jakarta';
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Indonesia&method=2`);
        res.json({ success: true, data: response.data.data.timings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'API Sholat sedang gangguan' });
    }
});

module.exports = app;
