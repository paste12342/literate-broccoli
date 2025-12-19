import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { networkInterfaces } from 'os'; // ✅ ES Module import

// Railway compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Scramjet files - Railway compatible path
const scramjetPath = process.env.NODE_ENV === 'production'
  ? '/node_modules/@mercuryworkshop/scramjet/dist'
  : join(__dirname, 'node_modules/@mercuryworkshop/scramjet/dist');

// Check if Scramjet files exist
try {
  if (fs.existsSync(join(scramjetPath, 'scramjet.all.js'))) {
    console.log('✅ Scramjet files found at:', scramjetPath);
    app.use('/scram', express.static(scramjetPath));
  } else {
    console.log('⚠️ Scramjet files not found, using fallback');
    app.use('/scram', (req, res) => {
      res.status(404).send('Scramjet files not installed. Check Railway logs.');
    });
  }
} catch (error) {
  console.error('❌ Scramjet path error:', error);
}

// Bare endpoint for proxying
app.all('/bare/*', async (req, res) => {
  try {
    const target = decodeURIComponent(req.path.replace('/bare/', ''));
    
    if (!target.startsWith('http')) {
      return res.status(400).send('Invalid URL');
    }
    
    const url = new URL(target);
    const headers = { ...req.headers };
    
    // Clean headers
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    headers['user-agent'] = 'Mozilla/5.0 (Railway Scramjet Proxy)';
    
    const options = {
      method: req.method,
      headers: headers,
      redirect: 'follow'
    };
    
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req;
    }
    
    const response = await fetch(url, options);
    
    // Copy response headers
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    }
    
    responseHeaders['access-control-allow-origin'] = '*';
    responseHeaders['access-control-allow-methods'] = '*';
    responseHeaders['access-control-allow-headers'] = '*';
    
    res.writeHead(response.status, responseHeaders);
    response.body.pipe(res);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy route for iframe
app.get('/proxy/:url', async (req, res) => {
  try {
    const targetUrl = decodeURIComponent(req.params.url);
    const response = await fetch(targetUrl);
    const html = await response.text();
    
    // Basic HTML rewriting for proxy
    const rewritten = html
      .replace(/src="\//g, `src="/proxy/${encodeURIComponent(new URL('/', targetUrl).href)}`)
      .replace(/href="\//g, `href="/proxy/${encodeURIComponent(new URL('/', targetUrl).href)}`);
    
    res.send(rewritten);
  } catch (error) {
    res.status(500).send(`Proxy Error: ${error.message}`);
  }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'scramjet-proxy',
    node: process.version,
    railway: !!process.env.RAILWAY_ENVIRONMENT
  });
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Fallback Scramjet route if npm install fails
const publicScramPath = join(__dirname, 'public/scram');
if (fs.existsSync(publicScramPath)) {
  console.log('📁 Using fallback Scramjet from /public/scram');
  app.use('/scram', express.static(publicScramPath));
} else {
  // Create minimal fallback
  app.get('/scram/scramjet.all.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
      console.log('Scramjet fallback loaded');
      window.$scramjetLoadController = () => ({ 
        ScramjetController: class { 
          constructor() {} 
          async init() { 
            console.log('Fallback Scramjet initialized');
            return Promise.resolve();
          } 
        } 
      });
      window.$scramjetLoadWorker = () => ({ 
        ScramjetServiceWorker: class { 
          constructor() {} 
          async loadConfig() { return Promise.resolve(); } 
          route() { return false; } 
          fetch(e) { return fetch(e.request); } 
        } 
      });
    `);
  });
  
  app.get('/scram/:file', (req, res) => {
    res.send('');
  });
}

// Start server - SIMPLIFIED VERSION
app.listen(PORT, () => {
  console.log(`
  🚀 Scramjet Proxy Server
  ========================
  📍 Port: ${PORT}
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  🚂 Railway: ${process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No'}
  📁 Directory: ${__dirname}
  
  ✅ Server is running!
  
  Health check: http://localhost:${PORT}/health
  `);
});
