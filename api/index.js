/**
 * BACKEND ENGINE (Serverless)
 * Core: Express.js
 */
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // Batas 20MB
});

app.use(cors());
app.use(express.json());

// 1. Endpoint Check
app.get('/api', (req, res) => {
    res.json({ 
        status: "Online", 
        owner: "Denis Pedia", 
        endpoints: ["/api/upload", "/api/prayer"] 
    });
});

// 2. Endpoint Photo to URL (Catbox)
app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const catboxRes = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
        });

        res.status(200).json({ success: true, url: catboxRes.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Endpoint Jadwal Sholat
app.get('/api/prayer', async (req, res) => {
    try {
        const city = req.query.city || 'Jakarta';
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Indonesia&method=2`);
        res.status(200).json({ success: true, data: response.data.data.timings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch prayer data' });
    }
});

module.exports = app;
