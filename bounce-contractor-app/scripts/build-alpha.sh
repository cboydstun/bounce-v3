#!/bin/bash

# Build script for alpha releases
# This script builds the app and prepares it for Google Play Console Internal Testing

set -e

echo "🚀 Building Bounce Contractor Alpha Release..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf android/app/src/main/assets/public/

# Build the web app
echo "📦 Building web application..."
npm run build:prod

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

echo "✅ Alpha build preparation complete!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Build signed AAB: Build > Generate Signed Bundle/APK"
echo "3. Upload to Google Play Console Internal Testing"
echo ""
echo "Or use Gradle command line:"
echo "cd android && ./gradlew bundleRelease"
