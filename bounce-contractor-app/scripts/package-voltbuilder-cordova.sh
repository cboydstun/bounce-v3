#!/bin/bash

# VoltBuilder Cordova Package Script
# Creates a Cordova-compatible ZIP archive for VoltBuilder upload

set -e

echo "📦 Creating VoltBuilder Cordova package..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Get project info
PROJECT_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="${PROJECT_NAME}_voltbuilder_cordova_${VERSION}_${TIMESTAMP}.zip"

echo "📋 Project: $PROJECT_NAME v$VERSION"
echo "📁 Archive: $ARCHIVE_NAME"

# Check if project is built
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Project not built. Please run 'npm run build:prod' first."
    exit 1
fi

# Check if config.xml exists
if [ ! -f "config.xml" ]; then
    echo "❌ Error: config.xml not found. This is required for VoltBuilder."
    exit 1
fi

# Create temporary directory for packaging
TEMP_DIR="voltbuilder_cordova_temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📂 Creating Cordova-compatible structure..."

# Copy and rename dist to www (Cordova expects www folder)
cp -r dist/ "$TEMP_DIR/www/"

# Ensure index.html has cordova.js script
echo "🔧 Adding cordova.js script to index.html..."
INDEX_FILE="$TEMP_DIR/www/index.html"

# Check if cordova.js is already included
if ! grep -q "cordova.js" "$INDEX_FILE"; then
    # Add cordova.js script before closing head tag
    sed -i 's|</head>|  <script src="cordova.js"></script>\n</head>|' "$INDEX_FILE"
    echo "✅ Added cordova.js script to index.html"
else
    echo "✅ cordova.js script already present in index.html"
fi

# Copy Cordova configuration files
cp config.xml "$TEMP_DIR/"
cp voltbuilder.json "$TEMP_DIR/"

# Create empty certificates folder (user will add their certificates)
mkdir -p "$TEMP_DIR/certificates"
cat > "$TEMP_DIR/certificates/README.md" << EOF
# Certificates Folder

Add your iOS certificates and provisioning profiles here:

## For Development Builds:
- ios_development.p12 (iOS Development Certificate)
- development.mobileprovision (Development Provisioning Profile)

## For Distribution Builds:
- ios_distribution.p12 (iOS Distribution Certificate)  
- distribution.mobileprovision (Distribution Provisioning Profile)

## For Android Builds:
- android.keystore (Android Keystore file)

Then update voltbuilder.json with the correct filenames and passwords.

## Getting Certificates:
1. Go to https://developer.apple.com
2. Navigate to Certificates, Identifiers & Profiles
3. Create/download your certificates and provisioning profiles
4. Export certificates as .p12 files with passwords
5. Download .mobileprovision files

## VoltBuilder Documentation:
https://docs.voltbuilder.com/certificates
EOF

# Copy package.json for dependency information
cp package.json "$TEMP_DIR/"

# Create a simple build info file
cat > "$TEMP_DIR/voltbuilder-build-info.json" << EOF
{
  "packagedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "packagedBy": "$(whoami)",
  "projectName": "$PROJECT_NAME",
  "version": "$VERSION",
  "platform": "ios",
  "framework": "cordova",
  "buildTool": "vite",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "archiveName": "$ARCHIVE_NAME",
  "structure": "cordova-compatible"
}
EOF

# Create .voltbuilderignore file
cat > "$TEMP_DIR/.voltbuilderignore" << EOF
# VoltBuilder ignore file for Cordova projects

# Dependencies (VoltBuilder will run npm install)
node_modules/

# Development files
.git/
.gitignore
.env*
*.log
*.tmp

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Test files
cypress/
*.test.*
*.spec.*

# Build artifacts that will be regenerated
.vite/

# Documentation (optional)
docs/
*.md
EOF

echo "🗜️  Creating ZIP archive..."

# Create the ZIP archive
cd "$TEMP_DIR"
zip -r "../$ARCHIVE_NAME" . -x "*.DS_Store" "*.log" "node_modules/*" > /dev/null
cd ..

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# Get archive size
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

echo ""
echo "✅ VoltBuilder Cordova package created successfully!"
echo ""
echo "📦 Archive Details:"
echo "   📁 File: $ARCHIVE_NAME"
echo "   📏 Size: $ARCHIVE_SIZE"
echo "   📅 Created: $(date)"
echo "   🏗️  Structure: Cordova-compatible"
echo ""
echo "📋 Package Contents:"
echo "   ✅ www/ folder (renamed from dist/)"
echo "   ✅ config.xml (Cordova configuration)"
echo "   ✅ voltbuilder.json (VoltBuilder settings)"
echo "   ✅ certificates/ folder (empty - add your certificates)"
echo "   ✅ package.json (dependencies)"
echo "   ✅ cordova.js script added to index.html"
echo ""
echo "🔑 Next Steps - Add Certificates:"
echo "   1. Extract the ZIP file"
echo "   2. Add your iOS certificates to certificates/ folder:"
echo "      - ios_development.p12"
echo "      - development.mobileprovision"
echo "      - ios_distribution.p12 (for App Store)"
echo "      - distribution.mobileprovision (for App Store)"
echo "   3. Update voltbuilder.json with certificate filenames and passwords"
echo "   4. Re-zip the project"
echo "   5. Upload to VoltBuilder"
echo ""
echo "📋 VoltBuilder Upload Steps:"
echo "   1. Go to https://voltbuilder.com"
echo "   2. Sign up for 15-day free trial (required for iOS)"
echo "   3. Create a new project"
echo "   4. Upload your ZIP file"
echo "   5. Start the build process"
echo ""
echo "🔗 Useful links:"
echo "   - VoltBuilder: https://voltbuilder.com"
echo "   - Certificate Guide: https://docs.voltbuilder.com/certificates"
echo "   - Apple Developer: https://developer.apple.com"
