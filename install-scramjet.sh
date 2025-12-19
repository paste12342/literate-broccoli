#!/bin/bash
# Railway post-install script for Scramjet
echo "Installing Scramjet on Railway..."

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Install Scramjet with pnpm
pnpm add @mercuryworkshop/scramjet@2.0.0-alpha

echo "Scramjet installation complete!"
