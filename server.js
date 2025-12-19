import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Scramjet specific route - serves Scramjet files
app.use('/scram', express.static(join(__dirname, 'node_modules/@mercuryworkshop/scramjet/dist')));

// BareMux worker endpoint (required for Scramjet)
app.get('/baremux/worker.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
        // BareMux Worker - Simple transport for Scramjet
        self.addEventListener('message', (e) => {
            if (e.data.type === 'init') {
                self.postMessage({ type: 'ready' });
            }
        });
    `);
});

// Bare transport endpoint
app.all('/bare/*', async (req, res) => {
    try {
        const url = req.path.replace('/bare/', '');
        const targetUrl = new URL(decodeURIComponent(url));
        
        const options = {
            method: req.method,
            headers: { ...req.headers },
            redirect: 'follow'
        };
        
        // Remove problematic headers
        delete options.headers.host;
        delete options.headers.origin;
        delete options.headers.referer;
        
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            options.body = req;
        }
        
        const fetchRes = await fetch(targetUrl, options);
        
        // Copy headers
        for (const [key, value] of fetchRes.headers.entries()) {
            if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        }
        
        res.status(fetchRes.status);
        fetchRes.body.pipe(res);
    } catch (error) {
        console.error('Bare error:', error);
        res.status(500).send('Proxy error: ' + error.message);
    }
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Scramjet Proxy running at:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://${getIPAddress()}:${PORT}`);
    console.log(`\n📖 Open the URL above in your browser`);
});

function getIPAddress() {
    const interfaces = require('os').networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
    return 'localhost';
}
