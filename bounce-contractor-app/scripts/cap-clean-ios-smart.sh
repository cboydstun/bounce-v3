#!/bin/bash

# Smart iOS Clean Build Script
# Automatically detects OS and runs appropriate build command

set -e

echo "🔍 Detecting operating system..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - running full iOS build with device deployment"
    echo "📱 Executing: rm -rf dist/ && rm -rf ios/App/App/public/ && npm run build:prod && npx cap sync ios && npx cap run ios"
    echo ""
    
    # Clean previous builds
    rm -rf dist/
    rm -rf ios/App/App/public/
    
    # Build and run
    npm run build:prod
    npx cap sync ios
    npx cap run ios
    
else
    echo "🐧 Linux/Non-macOS system detected - running build and sync only"
    echo "📱 Executing Linux-compatible iOS build..."
    echo ""
    
    # Use the Linux-specific script
    ./scripts/build-ios-linux.sh
fi
