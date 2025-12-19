// Main Scramjet Controller
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Scramjet Proxy...');
    
    try {
        // Wait for Scramjet scripts to load
        if (typeof $scramjetLoadController === 'undefined') {
            throw new Error('Scramjet scripts not loaded. Check your network tab.');
        }
        
        const { ScramjetController } = $scramjetLoadController();
        
        // Initialize Scramjet Controller
        const scramjet = new ScramjetController({
            files: {
                wasm: "/scram/scramjet.wasm.wasm",
                all: "/scram/scramjet.all.js",
                sync: "/scram/scramjet.sync.js",
            }
        });
        
        await scramjet.init();
        console.log('✅ Scramjet Controller initialized');
        
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });
                
                console.log('✅ Service Worker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                });
                
                // Update status
                document.getElementById('statusText').textContent = 'Scramjet Ready - Enter URL above';
                document.getElementById('statusIndicator').classList.add('active');
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
                showError('Service Worker failed: ' + error.message);
            }
        } else {
            showError('Service Workers not supported in this browser');
        }
        
        // Initialize BareMux for transport
        await initBareMux();
        
    } catch (error) {
        console.error('❌ Scramjet initialization error:', error);
        showError('Failed to initialize Scramjet: ' + error.message);
    }
});

// Initialize BareMux transport
async function initBareMux() {
    console.log('🔧 Initializing BareMux transport...');
    
    try {
        // Load BareMux if available
        if (typeof BareMux !== 'undefined') {
            const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
            
            // Create a simple HTTP transport
            const httpTransport = {
                meta: {
                    name: 'HTTP Transport',
                    description: 'Simple HTTP transport for Scramjet'
                },
                
                connect: async (url, options = {}) => {
                    console.log('📡 Connecting to:', url);
                    
                    // Use fetch API as transport
                    const response = await fetch('/bare/' + encodeURIComponent(url), {
                        method: options.method || 'GET',
                        headers: options.headers || {},
                        body: options.body,
                        mode: 'cors'
                    });
                    
                    return {
                        status: response.status,
                        headers: Object.fromEntries(response.headers.entries()),
                        body: response.body
                    };
                }
            };
            
            connection.setTransport(httpTransport);
            console.log('✅ BareMux transport initialized');
        } else {
            console.warn('⚠️ BareMux not found, using fallback transport');
        }
        
    } catch (error) {
        console.warn('⚠️ BareMux initialization warning:', error);
        // Continue without BareMux - Scramjet has fallbacks
    }
}

// Show error message
function showError(message) {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    statusText.textContent = 'Error: ' + message;
    statusIndicator.style.background = '#ff4757';
    
    // Also show alert for important errors
    if (message.includes('failed') || message.includes('not supported')) {
        setTimeout(() => {
            alert('Scramjet Error: ' + message + '\n\nCheck console for details.');
        }, 1000);
    }
}

// Enable debugging
window.enableScramjetDebug = () => {
    console.log('🔍 Enabling Scramjet debug mode...');
    localStorage.setItem('scramjet-debug', 'true');
    window.location.reload();
};

// Check for debug mode
if (localStorage.getItem('scramjet-debug') === 'true') {
    console.debug = console.log;
    console.log('🔍 Scramjet debug mode enabled');
}
