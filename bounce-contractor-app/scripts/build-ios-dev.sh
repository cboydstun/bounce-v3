#!/bin/bash

# Build script for iOS development testing
# This script builds the app and prepares it for direct iPhone testing

set -e

echo "📱 Building Bounce Contractor for iOS Development Testing..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf ios/App/App/public/

# Build the web app
echo "📦 Building web application..."
npm run build:prod

# Sync with Capacitor
echo "🔄 Syncing with Capacitor iOS..."
npx cap sync ios

echo "✅ iOS development build preparation complete!"
echo ""
echo "Next steps for iPhone testing:"
echo "1. Open Xcode: npx cap open ios"
echo "2. Connect your iPhone via USB"
echo "3. Trust your iPhone in Xcode (Window > Devices and Simulators)"
echo "4. Select your iPhone as the target device"
echo "5. Click the Play button to build and run on your device"
echo ""
echo "📋 Important reminders:"
echo "• Make sure your iPhone is connected and trusted"
echo "• Ensure you're signed in to your Apple Developer account in Xcode"
echo "• Your iPhone must be added to your provisioning profile"
echo "• Enable Developer Mode on your iPhone (Settings > Privacy & Security)"
echo ""
echo "🔧 Troubleshooting:"
echo "• If signing issues occur, go to Xcode > Preferences > Accounts"
echo "• For 'Untrusted Developer' error, go to iPhone Settings > General > VPN & Device Management"
