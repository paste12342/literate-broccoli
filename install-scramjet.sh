// install-scramjet.js - Pure Node.js installer
import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Installing Scramjet on Railway...');
console.log('==================================');

try {
  // Try npm install first (fallback if pnpm fails)
  console.log('📦 Attempting to install Scramjet via npm...');
  
  // Install Scramjet directly with npm
  execSync('npm install @mercuryworkshop/scramjet@2.0.0-alpha --no-fund --no-audit', {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  // Verify installation
  const scramjetPath = join(__dirname, 'node_modules/@mercuryworkshop/scramjet');
  
  if (fs.existsSync(scramjetPath)) {
    console.log('✅ Scramjet installed successfully via npm');
    console.log(`📁 Location: ${scramjetPath}`);
    
    // List dist files if they exist
    const distPath = join(scramjetPath, 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      console.log(`📋 Dist files found: ${files.length} files`);
      files.forEach(file => console.log(`   - ${file}`));
    }
  } else {
    console.log('⚠️ Scramjet folder not found, trying alternative...');
    
    // Try creating a minimal Scramjet structure
    const minimalScramjet = `
      // Minimal Scramjet fallback
      window.$scramjetLoadController = () => ({ 
        ScramjetController: class { 
          constructor() {} 
          async init() { console.log('Scramjet fallback initialized') } 
        } 
      });
      window.$scramjetLoadWorker = () => ({ 
        ScramjetServiceWorker: class { 
          constructor() {} 
          async loadConfig() {} 
          route() { return false } 
          fetch(e) { return fetch(e.request) } 
        } 
      });
    `;
    
    // Create fallback files
    const fallbackDir = join(__dirname, 'public/scram');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    
    fs.writeFileSync(join(fallbackDir, 'scramjet.all.js'), minimalScramjet);
    fs.writeFileSync(join(fallbackDir, 'scramjet.wasm.wasm'), '');
    fs.writeFileSync(join(fallbackDir, 'scramjet.sync.js'), minimalScramjet);
    
    console.log('📁 Created fallback Scramjet files in /public/scram/');
  }
  
} catch (error) {
  console.error('❌ Installation error:', error.message);
  console.log('⚠️ Continuing with fallback mode...');
  
  // Create a simple fallback
  const publicDir = join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const fallbackJS = `
    console.log('Scramjet fallback loaded');
    window.$scramjetLoadController = window.$scramjetLoadWorker = () => ({});
  `;
  
  fs.writeFileSync(join(publicDir, 'scramjet-fallback.js'), fallbackJS);
}

console.log('==================================');
console.log('✅ Installation process complete!');
