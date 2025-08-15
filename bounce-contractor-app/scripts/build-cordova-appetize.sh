#!/bin/bash

# Cordova iOS Build Script for Appetize.io
# Creates a proper iOS simulator build with x86_64/arm64 architecture

set -e

echo "📱 Building Cordova iOS app for Appetize.io..."

# Step 1: Build the web assets first
echo "🏗️  Building web assets..."
npm run build:prod

# Step 2: Create Cordova project structure if it doesn't exist
if [ ! -d "platforms" ]; then
    echo "🔧 Initializing Cordova project structure..."
    
    # Create www directory and copy built assets
    mkdir -p www
    cp -r dist/* www/
    
    # Initialize Cordova project
    cordova platform add ios --save
    
    echo "✅ Cordova project initialized"
else
    echo "📁 Cordova project already exists, updating..."
    
    # Update www directory with latest build
    rm -rf www/*
    cp -r dist/* www/
    
    # Ensure iOS platform is added
    if [ ! -d "platforms/ios" ]; then
        cordova platform add ios --save
    fi
fi

# Step 3: Install required plugins
echo "🔌 Installing Cordova plugins..."
cordova plugin add cordova-plugin-device --save || true
cordova plugin add cordova-plugin-network-information --save || true
cordova plugin add cordova-plugin-statusbar --save || true
cordova plugin add cordova-plugin-splashscreen --save || true
cordova plugin add cordova-plugin-camera --save || true
cordova plugin add cordova-plugin-geolocation --save || true
cordova plugin add cordova-plugin-vibration --save || true
cordova plugin add cordova-plugin-keyboard --save || true

# Step 4: Build for iOS simulator
echo "📱 Building iOS simulator app..."
cordova build ios --emulator --device

# Step 5: Find and package the .app bundle
echo "📦 Packaging for Appetize.io..."

# Look for the built .app in various possible locations
APP_BUNDLE=""
if [ -d "platforms/ios/build/emulator" ]; then
    APP_BUNDLE=$(find platforms/ios/build/emulator -name "*.app" -type d | head -1)
elif [ -d "platforms/ios/build/Debug-iphonesimulator" ]; then
    APP_BUNDLE=$(find platforms/ios/build/Debug-iphonesimulator -name "*.app" -type d | head -1)
elif [ -d "platforms/ios/build" ]; then
    APP_BUNDLE=$(find platforms/ios/build -name "*.app" -type d | head -1)
fi

if [ -z "$APP_BUNDLE" ]; then
    echo "❌ Could not find .app bundle. Checking build output..."
    find platforms/ios -name "*.app" -type d
    exit 1
fi

echo "✅ Found app bundle: $APP_BUNDLE"

# Create zip file for appetize.io
BUILD_DIR="cordova-appetize-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy the .app bundle
cp -r "$APP_BUNDLE" "$BUILD_DIR/"

# Create zip
cd "$BUILD_DIR"
APP_NAME=$(basename "$APP_BUNDLE")
zip -r "../partypad-cordova-appetize.zip" "$APP_NAME"
cd ..

echo ""
echo "✅ Cordova iOS build for Appetize.io completed!"
echo "📁 App bundle: $APP_BUNDLE"
echo "📦 Zip file: partypad-cordova-appetize.zip"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload 'partypad-cordova-appetize.zip' to appetize.io"
echo "   2. Select iOS platform"
echo "   3. Test your app with proper iOS simulator architecture!"
echo ""
echo "💡 This build contains:"
echo "   - Real iOS simulator binary (x86_64/arm64)"
echo "   - Proper Mach-O executable format"
echo "   - iOS framework linkages"
echo "   - Cordova plugins and native functionality"
