#!/bin/bash

# iOS App Bundle Builder for Appetize.io
# Creates a proper .app bundle structure that appetize.io can process

set -e

echo "🍎 Building iOS app bundle for Appetize.io..."

# Check if we have the iOS project synced
if [ ! -d "ios/App/App/public" ]; then
    echo "❌ iOS project not found or not synced. Running build first..."
    ./scripts/build-ios-linux.sh
fi

# Create build directory
BUILD_DIR="ios-appetize-build"
APP_NAME="PartyPad.app"
APP_BUNDLE="$BUILD_DIR/$APP_NAME"

echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$APP_BUNDLE"

echo "📱 Creating iOS app bundle structure..."

# Create the main executable (stub for appetize.io)
echo "🔧 Creating executable stub..."
cat > "$APP_BUNDLE/PartyPad" << 'EOF'
#!/bin/bash
# iOS App Executable Stub for Appetize.io
echo "PartyPad iOS App"
EOF
chmod +x "$APP_BUNDLE/PartyPad"

# Create Info.plist with proper values
echo "📄 Creating Info.plist..."
cat > "$APP_BUNDLE/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>Bounce Contractor (Alpha)</string>
	<key>CFBundleExecutable</key>
	<string>PartyPad</string>
	<key>CFBundleIdentifier</key>
	<string>com.bouncecontractor.app</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>PartyPad</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>armv7</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
</dict>
</plist>
EOF

# Create PkgInfo file
echo "📦 Creating PkgInfo..."
echo -n "APPL????" > "$APP_BUNDLE/PkgInfo"

# Copy web assets to www directory (Capacitor/Cordova convention)
echo "🌐 Copying web assets..."
mkdir -p "$APP_BUNDLE/www"
cp -r ios/App/App/public/* "$APP_BUNDLE/www/"

# Copy app icons and assets
echo "🎨 Copying app assets..."
if [ -d "ios/App/App/Assets.xcassets" ]; then
    cp -r ios/App/App/Assets.xcassets "$APP_BUNDLE/"
fi

# Copy storyboards
echo "📱 Copying storyboards..."
if [ -d "ios/App/App/Base.lproj" ]; then
    cp -r ios/App/App/Base.lproj "$APP_BUNDLE/"
fi

# Create the zip file for appetize.io
echo "📦 Creating zip file for Appetize.io..."
cd "$BUILD_DIR"
zip -r "../partypad-ios-appetize.zip" "$APP_NAME"
cd ..

echo ""
echo "✅ iOS app bundle created successfully!"
echo "📁 Bundle location: $APP_BUNDLE"
echo "📦 Zip file: partypad-ios-appetize.zip"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload 'partypad-ios-appetize.zip' to appetize.io"
echo "   2. Select iOS platform"
echo "   3. Test your app!"
echo ""
echo "💡 The app bundle contains:"
echo "   - Executable stub: PartyPad"
echo "   - App metadata: Info.plist"
echo "   - Web assets: www/"
echo "   - App icons and resources"
