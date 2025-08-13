#!/bin/bash

# Build script for Firebase App Distribution iOS releases
# This script builds the app and prepares it for Firebase App Distribution

set -e

echo "🚀 Building Bounce Contractor iOS for Firebase App Distribution..."

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

# Build iOS archive
echo "🔨 Building iOS archive..."
echo "Opening Xcode for manual archive creation..."
npx cap open ios

echo "✅ iOS project opened in Xcode!"
echo ""
echo "📱 Manual Archive Steps in Xcode:"
echo "1. Select 'Any iOS Device (arm64)' as the destination"
echo "2. Go to Product > Archive"
echo "3. Wait for the archive to complete"
echo "4. In the Organizer window, select 'Distribute App'"
echo "5. Choose 'Ad Hoc' or 'Development' for Firebase distribution"
echo "6. Follow the export wizard to create the .ipa file"
echo ""
echo "🔥 Firebase App Distribution Upload:"
echo "Option 1 - Firebase CLI (if installed):"
echo "  firebase appdistribution:distribute path/to/your/app.ipa \\"
echo "    --app YOUR_IOS_APP_ID \\"
echo "    --groups 'testers' \\"
echo "    --release-notes 'iOS Alpha Release'"
echo ""
echo "Option 2 - Manual Upload:"
echo "1. Go to Firebase Console: https://console.firebase.google.com/project/bouncer-contractor/appdistribution"
echo "2. Click 'Distribute new release'"
echo "3. Upload the .ipa file from Xcode export"
echo "4. Add release notes and select tester groups"
echo ""
echo "📋 Prerequisites for Firebase iOS Distribution:"
echo "• iOS app must be registered in Firebase Console"
echo "• Firebase CLI installed: npm install -g firebase-tools"
echo "• Authenticated with Firebase: firebase login"
echo "• iOS App ID configured in Firebase project"
echo ""
echo "🔧 Alternative Command Line Archive (Advanced):"
echo "cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -archivePath ./build/App.xcarchive archive"
