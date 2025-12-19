// Fallback Scramjet implementation
console.log('🚀 Scramjet Fallback Loaded');

window.$scramjetLoadController = function() {
  console.log('📱 Loading Scramjet Controller (fallback)');
  return {
    ScramjetController: class {
      constructor(config) {
        console.log('🎮 Scramjet Controller created', config);
        this.config = config;
      }
      
      async init() {
        console.log('✅ Scramjet Controller initialized (fallback)');
        return Promise.resolve();
      }
    }
  };
};

window.$scramjetLoadWorker = function() {
  console.log('👷 Loading Scramjet Worker (fallback)');
  return {
    ScramjetServiceWorker: class {
      constructor() {
        console.log('🔧 Scramjet Worker created (fallback)');
      }
      
      async loadConfig() {
        console.log('⚙️ Loading config (fallback)');
        return Promise.resolve();
      }
      
      route(event) {
        // Don't route any requests in fallback
        return false;
      }
      
      fetch(event) {
        // Pass through all requests
        return fetch(event.request);
      }
    }
  };
};
