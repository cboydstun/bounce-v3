#!/bin/bash

# VoltBuilder Preparation Script
# Prepares the project for VoltBuilder iOS cloud builds

set -e

echo "🔧 Preparing project for VoltBuilder..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf ios/App/App/public/

# Build the project
echo "🏗️  Building project for production..."
npm run build:prod

# Sync Capacitor
echo "📱 Syncing Capacitor..."
npx cap sync ios

# Ensure capacitor.config.json exists and is up to date
echo "⚙️  Ensuring capacitor.config.json is current..."
if [ -f "capacitor.config.ts" ] && [ -f "capacitor.config.json" ]; then
    echo "✅ Both TypeScript and JSON configs found"
    echo "⚠️  Note: Make sure capacitor.config.json is synchronized with capacitor.config.ts"
elif [ -f "capacitor.config.ts" ] && [ ! -f "capacitor.config.json" ]; then
    echo "❌ Error: capacitor.config.json not found but capacitor.config.ts exists"
    echo "   Please create capacitor.config.json or run the config conversion script"
    exit 1
fi

# Check for required files
echo "📋 Checking required files for VoltBuilder..."

required_files=(
    "package.json"
    "capacitor.config.json"
    "ionic.config.json"
    "tsconfig.json"
    "dist/index.html"
    "ios/App/App.xcodeproj/project.pbxproj"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing required files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

# Check iOS assets
echo "🖼️  Checking iOS assets..."
ios_assets_dir="ios/App/App/Assets.xcassets"
if [ ! -d "$ios_assets_dir" ]; then
    echo "⚠️  Warning: iOS assets directory not found at $ios_assets_dir"
    echo "   You may need to add app icons and splash screens"
fi

# Create VoltBuilder info file
echo "📄 Creating VoltBuilder project info..."
cat > voltbuilder-info.json << EOF
{
  "projectName": "Bounce Contractor App",
  "appId": "com.bouncecontractor.app",
  "appName": "Bounce Contractor (Alpha)",
  "platform": "ios",
  "framework": "capacitor",
  "buildType": "production",
  "preparationDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "capacitorVersion": "$(npx cap --version | head -n1)"
}
EOF

# Create upload checklist
echo "📝 Creating upload checklist..."
cat > VOLTBUILDER_CHECKLIST.md << EOF
# VoltBuilder Upload Checklist

## Pre-Upload Verification

- [ ] Project built successfully (\`npm run build:prod\`)
- [ ] Capacitor synced (\`npx cap sync ios\`)
- [ ] \`capacitor.config.json\` exists and is current
- [ ] \`dist/\` folder contains built web assets
- [ ] iOS project structure is intact
- [ ] App icons and splash screens are in place

## Required Files Present

- [ ] \`package.json\`
- [ ] \`capacitor.config.json\`
- [ ] \`ionic.config.json\`
- [ ] \`tsconfig.json\`
- [ ] \`dist/index.html\`
- [ ] \`ios/App/App.xcodeproj/project.pbxproj\`

## VoltBuilder Configuration

- [ ] VoltBuilder account set up
- [ ] iOS certificates uploaded to VoltBuilder
- [ ] Provisioning profiles configured
- [ ] Bundle ID matches certificates
- [ ] App Store Connect app created (if needed)

## Upload Process

1. Create ZIP archive of entire project directory
2. Upload to VoltBuilder dashboard
3. Configure build settings
4. Start build process
5. Monitor build logs
6. Download IPA file when complete

## Post-Build

- [ ] Test IPA on device/simulator
- [ ] Verify all features work correctly
- [ ] Upload to App Store Connect (if ready)

Generated: $(date)
EOF

echo ""
echo "✅ VoltBuilder preparation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the generated VOLTBUILDER_CHECKLIST.md"
echo "   2. Create a ZIP archive of the entire project directory"
echo "   3. Upload to VoltBuilder dashboard"
echo "   4. Configure build settings and start the build"
echo ""
echo "📁 Files ready for VoltBuilder:"
echo "   - capacitor.config.json (✅)"
echo "   - dist/ folder with built assets (✅)"
echo "   - ios/ folder with native project (✅)"
echo "   - All required configuration files (✅)"
echo ""
echo "💡 Tip: Exclude node_modules/ from your ZIP archive to reduce upload size"
echo "   VoltBuilder will run 'npm install' automatically"
