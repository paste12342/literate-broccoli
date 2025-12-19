// Service Worker for Scramjet Proxy
importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener('install', (event) => {
    console.log('🚀 Scramjet Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🚀 Scramjet Service Worker activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith((async () => {
        try {
            // Load Scramjet configuration
            await scramjet.loadConfig();
            
            // Check if this request should be handled by Scramjet
            if (scramjet.route(event)) {
                console.log('🔀 Scramjet routing:', event.request.url);
                return await scramjet.fetch(event);
            }
            
            // Handle proxy requests
            const url = new URL(event.request.url);
            
            if (url.pathname.startsWith('/proxy/')) {
                const targetUrl = decodeURIComponent(url.pathname.replace('/proxy/', ''));
                
                // Create new request to target URL
                const proxyRequest = new Request(targetUrl, {
                    method: event.request.method,
                    headers: event.request.headers,
                    body: event.request.method !== 'GET' ? event.request.body : null,
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                // Remove problematic headers
                const headers = new Headers(proxyRequest.headers);
                headers.delete('origin');
                headers.delete('referer');
                
                // Fetch through Scramjet or directly
                const response = await fetch(proxyRequest);
                
                // Modify response headers for CORS
                const responseHeaders = new Headers(response.headers);
                responseHeaders.set('access-control-allow-origin', '*');
                responseHeaders.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
                responseHeaders.set('access-control-allow-headers', '*');
                
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders
                });
            }
            
            // Default fetch for other requests
            return fetch(event.request);
            
        } catch (error) {
            console.error('❌ Service Worker fetch error:', error);
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Scramjet Proxy Error</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 40px; 
                            text-align: center; 
                            background: #f0f0f0; 
                        }
                        .error { 
                            background: white; 
                            padding: 30px; 
                            border-radius: 10px; 
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                        }
                        h1 { color: #ff4757; }
                        code { 
                            background: #f8f9fa; 
                            padding: 10px; 
                            border-radius: 5px; 
                            display: block; 
                            margin: 20px 0; 
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h1>Proxy Error</h1>
                        <p>${error.message}</p>
                        <p>Try refreshing the page or checking the URL.</p>
                        <button onclick="location.reload()">Refresh Page</button>
                    </div>
                </body>
                </html>
            `, {
                status: 500,
                headers: { 'Content-Type': 'text/html' }
            });
        }
    })());
});
