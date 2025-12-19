#!/bin/bash
echo "🚀 Installing Scramjet on Railway..."
echo "=================================="

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
    echo "✅ pnpm installed"
else
    echo "✅ pnpm already installed"
fi

# Install Scramjet
echo "📦 Installing Scramjet package..."
pnpm add @mercuryworkshop/scramjet@2.0.0-alpha --no-frozen-lockfile

# Verify installation
if [ -d "node_modules/@mercuryworkshop/scramjet" ]; then
    echo "✅ Scramjet installed successfully"
    echo "📁 Location: node_modules/@mercuryworkshop/scramjet"
    
    # List installed files
    echo "📋 Installed files:"
    ls -la node_modules/@mercuryworkshop/scramjet/dist/ || echo "⚠️ No dist folder found"
else
    echo "❌ Scramjet installation failed!"
    exit 1
fi

echo "=================================="
echo "✅ Installation complete!"
