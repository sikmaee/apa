const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// API Root
app.get('/api', (req, res) => {
    res.json({ status: "DP-API Active", user: "sikmaee", repo: "simpanrx" });
});

// Endpoint Upload (Dual Provider)
app.post('/api/upload', upload.single('image'), async (req, res) => {
    const { provider } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'File tidak ditemukan' });

    try {
        if (provider === 'github') {
            const token = process.env.GITHUB_TOKEN;
            const repo = process.env.REPO_NAME; 
            const path = `uploads/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
            const b64 = req.file.buffer.toString('base64');

            const ghRes = await axios.put(`https://api.github.com/repos/${repo}/contents/${path}`, {
                message: `Upload via DP-API`,
                content: b64
            }, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
            });

            return res.json({ success: true, url: `https://cdn.jsdelivr.net/gh/${repo}@main/${path}` });
        } else {
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', req.file.buffer, { filename: req.file.originalname });
            const catRes = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
            return res.json({ success: true, url: catRes.data });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint Prayer
app.get('/api/prayer', async (req, res) => {
    const city = req.query.city || 'Jakarta';
    const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Indonesia&method=2`);
    res.json({ success: true, data: response.data.data.timings });
});

module.exports = app;
