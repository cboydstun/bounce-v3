#!/bin/bash

# iOS Build Script for Linux/Non-macOS Systems
# This script performs the build and sync operations without attempting to run on iOS

set -e

echo "🔧 Starting iOS build process for Linux..."

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS detected - you can use the regular cap:clean:ios command instead"
    echo "   Run: npm run cap:clean:ios"
    exit 0
fi

echo "🐧 Linux/Non-macOS system detected"
echo "📱 Building for iOS (build and sync only - no device deployment)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf ios/App/App/public/

# Build the project
echo "🏗️  Building project..."
npm run build:prod

# Sync with iOS
echo "📱 Syncing with iOS..."
npx cap sync ios

echo ""
echo "✅ iOS build and sync completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Transfer the project to a macOS machine"
echo "   2. Install Xcode and CocoaPods on macOS"
echo "   3. Run 'pod install' in the ios/App directory"
echo "   4. Open ios/App/App.xcworkspace in Xcode"
echo "   5. Build and run from Xcode"
echo ""
echo "💡 Alternatively, use Xcode Cloud or other CI/CD services for iOS builds"
