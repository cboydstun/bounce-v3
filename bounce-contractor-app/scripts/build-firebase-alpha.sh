#!/bin/bash

# Build script for Firebase App Distribution alpha releases
# This script builds the app and uploads it to Firebase App Distribution

set -e

echo "🚀 Building Bounce Contractor Alpha for Firebase App Distribution..."

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

# Build signed APK for Firebase App Distribution
echo "🔨 Building signed APK..."
cd android
./gradlew assembleRelease

echo "✅ APK build complete!"
echo ""
echo "📱 Firebase App Distribution Upload:"
echo "Run: ./gradlew appDistributionUploadRelease"
echo ""
echo "Or manually upload the APK from:"
echo "android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com/project/bouncer-contractor/appdistribution"
