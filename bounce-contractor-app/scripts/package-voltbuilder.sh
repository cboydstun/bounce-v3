#!/bin/bash

# VoltBuilder Package Script
# Creates a ZIP archive ready for VoltBuilder upload

set -e

echo "📦 Creating VoltBuilder package..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Get project info
PROJECT_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="${PROJECT_NAME}_voltbuilder_${VERSION}_${TIMESTAMP}.zip"

echo "📋 Project: $PROJECT_NAME v$VERSION"
echo "📁 Archive: $ARCHIVE_NAME"

# Check if project is prepared
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Project not built. Please run 'npm run voltbuilder:prepare' first."
    exit 1
fi

if [ ! -f "capacitor.config.json" ]; then
    echo "❌ Error: capacitor.config.json not found. Please run 'npm run voltbuilder:prepare' first."
    exit 1
fi

# Create temporary directory for packaging
TEMP_DIR="voltbuilder_package_temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📂 Copying files to temporary directory..."

# Copy essential files and directories
cp -r dist/ "$TEMP_DIR/"
cp -r ios/ "$TEMP_DIR/"
cp -r src/ "$TEMP_DIR/"
cp -r public/ "$TEMP_DIR/"

# Copy configuration files
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || echo "⚠️  package-lock.json not found, skipping..."
cp capacitor.config.json "$TEMP_DIR/"
cp ionic.config.json "$TEMP_DIR/" 2>/dev/null || echo "⚠️  ionic.config.json not found, skipping..."
cp tsconfig.json "$TEMP_DIR/"
cp tsconfig.node.json "$TEMP_DIR/" 2>/dev/null || echo "⚠️  tsconfig.node.json not found, skipping..."
cp vite.config.ts "$TEMP_DIR/" 2>/dev/null || echo "⚠️  vite.config.ts not found, skipping..."
cp tailwind.config.js "$TEMP_DIR/" 2>/dev/null || echo "⚠️  tailwind.config.js not found, skipping..."

# Copy other important files
cp README.md "$TEMP_DIR/" 2>/dev/null || echo "⚠️  README.md not found, skipping..."
cp .browserslistrc "$TEMP_DIR/" 2>/dev/null || echo "⚠️  .browserslistrc not found, skipping..."

# Copy VoltBuilder-specific files if they exist
cp voltbuilder.json "$TEMP_DIR/" 2>/dev/null || echo "⚠️  voltbuilder.json not found, skipping..."
cp voltbuilder-info.json "$TEMP_DIR/" 2>/dev/null || echo "⚠️  voltbuilder-info.json not found, skipping..."
cp VOLTBUILDER_CHECKLIST.md "$TEMP_DIR/" 2>/dev/null || echo "⚠️  VOLTBUILDER_CHECKLIST.md not found, skipping..."

# Create .voltbuilderignore file
cat > "$TEMP_DIR/.voltbuilderignore" << EOF
# VoltBuilder ignore file
# Files and directories to exclude from the build process

# Dependencies (VoltBuilder will run npm install)
node_modules/

# Build artifacts that will be regenerated
dist/
.vite/

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

# Documentation (optional, include if needed)
docs/
*.md

# Scripts not needed for build
scripts/build-*.sh
scripts/cap-*.sh
EOF

# Create build info file
cat > "$TEMP_DIR/voltbuilder-build-info.json" << EOF
{
  "packagedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "packagedBy": "$(whoami)",
  "projectName": "$PROJECT_NAME",
  "version": "$VERSION",
  "platform": "ios",
  "framework": "capacitor",
  "buildTool": "vite",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "capacitorVersion": "$(npx cap --version | head -n1 | cut -d' ' -f2)",
  "archiveName": "$ARCHIVE_NAME"
}
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
echo "✅ VoltBuilder package created successfully!"
echo ""
echo "📦 Archive Details:"
echo "   📁 File: $ARCHIVE_NAME"
echo "   📏 Size: $ARCHIVE_SIZE"
echo "   📅 Created: $(date)"
echo ""
echo "📋 Next steps:"
echo "   1. Go to https://voltbuilder.com"
echo "   2. Sign in to your VoltBuilder account"
echo "   3. Create a new project or select existing one"
echo "   4. Upload $ARCHIVE_NAME"
echo "   5. Configure build settings:"
echo "      - Platform: iOS"
echo "      - Framework: Capacitor"
echo "      - Bundle ID: com.bouncecontractor.app"
echo "   6. Add your iOS certificates and provisioning profiles"
echo "   7. Start the build process"
echo ""
echo "💡 Tips:"
echo "   - Keep your certificates and provisioning profiles up to date"
echo "   - Monitor the build logs for any issues"
echo "   - Test the generated IPA thoroughly before distribution"
echo ""
echo "🔗 Useful links:"
echo "   - VoltBuilder Documentation: https://docs.voltbuilder.com"
echo "   - iOS Certificate Guide: https://docs.voltbuilder.com/certificates"
echo "   - Capacitor Plugin Compatibility: https://docs.voltbuilder.com/plugins"
