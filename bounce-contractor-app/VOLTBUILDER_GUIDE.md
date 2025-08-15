# VoltBuilder iOS Build Guide

This guide explains how to build iOS apps using VoltBuilder cloud service, eliminating the need for a Mac computer.

## What is VoltBuilder?

VoltBuilder is a cloud-based build service that compiles Capacitor and Cordova apps for iOS and Android. It handles all the complex iOS build requirements (Xcode, certificates, provisioning profiles) on their remote servers.

## Why VoltBuilder?

- ✅ **No Mac Required**: Build iOS apps from Linux, Windows, or any platform
- ✅ **Cost Effective**: Much cheaper than buying a Mac just for building
- ✅ **Professional**: Generates App Store ready IPA files
- ✅ **Automated**: Integrates with CI/CD pipelines
- ✅ **Up-to-date**: Always uses latest Xcode and iOS SDKs

## Prerequisites

1. **VoltBuilder Account**: Sign up at [voltbuilder.com](https://voltbuilder.com)
2. **iOS Developer Account**: Required for certificates and App Store distribution
3. **Project Ready**: Your Capacitor project should be working locally

## Available Commands

### 🔧 Prepare Project for VoltBuilder

```bash
npm run voltbuilder:prepare
```

- Builds the project for production
- Syncs Capacitor iOS platform
- Validates all required files
- Creates VoltBuilder-specific configuration

### 📦 Create VoltBuilder Package

```bash
npm run voltbuilder:package
```

- Creates a ZIP archive ready for VoltBuilder upload
- Excludes unnecessary files (node_modules, etc.)
- Includes build metadata and instructions

### 🚀 Full Build Pipeline

```bash
npm run voltbuilder:build
```

- Runs both prepare and package commands
- One-command solution for complete VoltBuilder preparation

## Step-by-Step Process

### Step 1: Prepare Your Project

```bash
cd bounce-contractor-app
npm run voltbuilder:prepare
```

This will:

- Clean previous builds
- Build your project for production
- Sync Capacitor iOS platform
- Validate all required files
- Create configuration files

### Step 2: Create Upload Package

```bash
npm run voltbuilder:package
```

This creates a ZIP file named like: `partypad_voltbuilder_1.0.0-alpha.2_20250813_162230.zip`

### Step 3: VoltBuilder Setup

1. **Create Account**: Go to [voltbuilder.com](https://voltbuilder.com) and sign up
2. **Create Project**: Add a new project in your VoltBuilder dashboard
3. **Configure Settings**:
   - Platform: iOS
   - Framework: Capacitor
   - Bundle ID: `com.bouncecontractor.app`

### Step 4: iOS Certificates Setup

You'll need to upload to VoltBuilder:

#### Development Certificates

- **iOS Development Certificate** (.p12 file)
- **Development Provisioning Profile** (.mobileprovision file)

#### Distribution Certificates (for App Store)

- **iOS Distribution Certificate** (.p12 file)
- **App Store Provisioning Profile** (.mobileprovision file)

#### How to Get Certificates

1. **Apple Developer Account**: Log in to [developer.apple.com](https://developer.apple.com)
2. **Certificates Section**: Go to Certificates, Identifiers & Profiles
3. **Create App ID**: Register your bundle ID (`com.bouncecontractor.app`)
4. **Generate Certificates**: Create development and distribution certificates
5. **Create Provisioning Profiles**: Link certificates with your App ID
6. **Download**: Download .p12 certificates and .mobileprovision profiles

### Step 5: Upload and Build

1. **Upload ZIP**: Upload your generated ZIP file to VoltBuilder
2. **Configure Build**: Select certificates and provisioning profiles
3. **Start Build**: Initiate the build process
4. **Monitor Progress**: Watch build logs for any issues
5. **Download IPA**: Download the generated IPA file when complete

## Project Structure for VoltBuilder

Your project already has the correct structure:

```
bounce-contractor-app/
├── capacitor.config.json        # ✅ VoltBuilder config (JSON format)
├── capacitor.config.ts          # ✅ Development config (TypeScript)
├── ionic.config.json            # ✅ Ionic configuration
├── package.json                 # ✅ Dependencies and scripts
├── tsconfig.json               # ✅ TypeScript configuration
├── dist/                       # ✅ Built web assets
├── ios/                        # ✅ Native iOS project
├── src/                        # ✅ Source code
└── public/                     # ✅ Static assets
```

## Build Configuration

### Capacitor Config (capacitor.config.json)

```json
{
  "appId": "com.bouncecontractor.app",
  "appName": "Bounce Contractor (Alpha)",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1976d2"
    }
  }
}
```

### Key Settings

- **App ID**: `com.bouncecontractor.app` (must match certificates)
- **App Name**: `Bounce Contractor (Alpha)`
- **Web Directory**: `dist` (where built files are located)

## Troubleshooting

### Common Issues

#### Build Fails - Missing Files

**Problem**: Required files not found
**Solution**: Run `npm run voltbuilder:prepare` first

#### Certificate Errors

**Problem**: Invalid or expired certificates
**Solution**:

- Check certificate expiration dates
- Ensure bundle ID matches certificates
- Regenerate certificates if needed

#### Plugin Compatibility

**Problem**: Some plugins don't work with VoltBuilder
**Solution**:

- Check VoltBuilder plugin compatibility list
- Use alternative plugins if needed
- Contact VoltBuilder support for specific plugins

#### Large Upload Size

**Problem**: ZIP file too large for upload
**Solution**:

- Ensure node_modules is excluded
- Remove unnecessary files
- Optimize images and assets

### Build Optimization

#### Reduce Build Time

- Use VoltBuilder's caching features
- Minimize dependencies
- Optimize asset sizes

#### Cost Management

- Build only when necessary
- Use development builds for testing
- Batch multiple changes into single builds

## Capacitor Plugins Compatibility

Most standard Capacitor plugins work with VoltBuilder:

### ✅ Confirmed Working

- @capacitor/app
- @capacitor/camera
- @capacitor/geolocation
- @capacitor/haptics
- @capacitor/keyboard
- @capacitor/local-notifications
- @capacitor/network
- @capacitor/preferences
- @capacitor/push-notifications
- @capacitor/splash-screen
- @capacitor/status-bar

### ⚠️ May Need Configuration

- @capgo/capacitor-native-biometric
- capacitor-secure-storage-plugin

### 📞 Contact VoltBuilder Support

If you encounter issues with specific plugins, VoltBuilder support can help with compatibility.

## Pricing Considerations

VoltBuilder operates on a credit system:

- **Development Builds**: Lower cost, for testing
- **Production Builds**: Higher cost, App Store ready
- **Monthly Plans**: Available for regular builders

Compare this to:

- **Mac Mini**: $599+ one-time cost
- **MacBook**: $999+ one-time cost
- **Maintenance**: Xcode updates, macOS updates

For most developers, VoltBuilder is more cost-effective.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: iOS Build with VoltBuilder
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm install
      - name: Prepare for VoltBuilder
        run: npm run voltbuilder:prepare
      - name: Create package
        run: npm run voltbuilder:package
      # Upload to VoltBuilder via API (if available)
```

## Support and Resources

### VoltBuilder Resources

- **Documentation**: [docs.voltbuilder.com](https://docs.voltbuilder.com)
- **Support**: Available through VoltBuilder dashboard
- **Community**: VoltBuilder user forums

### Apple Resources

- **Developer Portal**: [developer.apple.com](https://developer.apple.com)
- **Certificate Guide**: Apple's certificate documentation
- **App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

### Capacitor Resources

- **Documentation**: [capacitorjs.com](https://capacitorjs.com)
- **Plugin Directory**: Official Capacitor plugins
- **Community**: Capacitor Discord and forums

## Migration from Local iOS Builds

If you were previously building locally on macOS:

1. **Keep Existing Setup**: VoltBuilder complements local development
2. **Use for Distribution**: Use VoltBuilder for App Store builds
3. **Team Collaboration**: Team members without Macs can now build iOS
4. **CI/CD**: Integrate VoltBuilder into automated pipelines

## Next Steps

1. **Sign up** for VoltBuilder account
2. **Run** `npm run voltbuilder:build` to create your first package
3. **Upload** and configure your first build
4. **Test** the generated IPA thoroughly
5. **Integrate** into your development workflow

VoltBuilder eliminates the Mac requirement for iOS development, making it accessible to developers on any platform while maintaining professional build quality.
