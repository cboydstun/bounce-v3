# VoltBuilder Cordova Setup Guide

## 🎉 Success! Your Project is Ready for VoltBuilder

Your Capacitor project has been successfully converted to Cordova format for VoltBuilder compatibility.

## 📦 What Was Created

### New Files:

- `config.xml` - Cordova configuration (converted from capacitor.config.json)
- `partypad_voltbuilder_cordova_1.0.0-alpha.2_20250813_184734.zip` - Ready-to-upload package

### New Scripts:

- `npm run voltbuilder:build:cordova` - Build and package for VoltBuilder
- `npm run voltbuilder:package:cordova` - Package existing build for VoltBuilder

## 🔧 Package Structure

The ZIP file contains a Cordova-compatible structure:

```
partypad_voltbuilder_cordova_*.zip
├── config.xml                    # Cordova configuration
├── voltbuilder.json              # VoltBuilder build settings
├── package.json                  # Dependencies
├── certificates/                 # Empty - add your certificates here
│   └── README.md                # Certificate instructions
├── www/                         # Web assets (renamed from dist/)
│   ├── index.html               # With cordova.js script added
│   ├── assets/                  # Built CSS/JS files
│   └── ...                      # Other web assets
└── voltbuilder-build-info.json  # Build metadata
```

## 🔑 Next Steps: Add iOS Certificates

### 1. Extract the ZIP File

```bash
unzip partypad_voltbuilder_cordova_1.0.0-alpha.2_20250813_184734.zip -d voltbuilder_project
cd voltbuilder_project
```

### 2. Get iOS Certificates from Apple

#### Go to Apple Developer Portal:

1. Visit [developer.apple.com](https://developer.apple.com)
2. Sign in with your Apple Developer account
3. Navigate to **Certificates, Identifiers & Profiles**

#### Create App ID (if not exists):

1. Go to **Identifiers** → **App IDs**
2. Click **+** to create new App ID
3. Use Bundle ID: `com.bouncecontractor.app`
4. Enable capabilities you need (Push Notifications, etc.)

#### Create Certificates:

1. Go to **Certificates** → **All**
2. Click **+** to create new certificate
3. Choose **iOS Development** (for testing)
4. Choose **iOS Distribution** (for App Store)
5. Follow instructions to generate CSR
6. Download certificates (.cer files)

#### Convert Certificates to P12:

1. Double-click .cer files to add to Keychain
2. In Keychain Access, find your certificates
3. Right-click → **Export** → Choose .p12 format
4. Set a password (remember this!)
5. Save as:
   - `ios_development.p12`
   - `ios_distribution.p12`

#### Create Provisioning Profiles:

1. Go to **Profiles** → **All**
2. Click **+** to create new profile
3. Choose **iOS App Development** (for testing)
4. Choose **App Store** (for distribution)
5. Select your App ID and certificates
6. Download .mobileprovision files
7. Rename to:
   - `development.mobileprovision`
   - `distribution.mobileprovision`

### 3. Add Certificates to Project

```bash
# Copy certificates to the certificates folder
cp ~/Downloads/ios_development.p12 certificates/
cp ~/Downloads/development.mobileprovision certificates/
cp ~/Downloads/ios_distribution.p12 certificates/
cp ~/Downloads/distribution.mobileprovision certificates/
```

### 4. Update voltbuilder.json

Edit `voltbuilder.json` with your certificate information:

```json
{
  "release": "debug",
  "verbose": true,
  "iosDevP12": "certificates/ios_development.p12",
  "iosDevP12Password": "your_p12_password",
  "iosDevelopment": "certificates/development.mobileprovision",
  "iosDistP12": "certificates/ios_distribution.p12",
  "iosDistP12Password": "your_p12_password",
  "iosDistribution": "certificates/distribution.mobileprovision",
  "iosPackageType": "ad-hoc"
}
```

### 5. Re-package for Upload

```bash
# Create new ZIP with certificates
zip -r partypad_with_certificates.zip . -x "*.DS_Store" "*.log"
```

## 🚀 Upload to VoltBuilder

### 1. Sign Up for VoltBuilder

1. Go to [voltbuilder.com](https://voltbuilder.com)
2. Sign up for **15-day free trial** (required for iOS builds)
3. Choose a plan that supports iOS

### 2. Create Project

1. Click **New Project**
2. Choose **Upload ZIP file**
3. Upload your `partypad_with_certificates.zip`

### 3. Configure Build

1. VoltBuilder will detect it as a Cordova project
2. Verify the configuration looks correct
3. Check that certificates are recognized

### 4. Start Build

1. Click **Build**
2. Monitor the build logs
3. Download IPA when complete

## 🐛 Troubleshooting

### Common Issues:

#### Certificate Errors:

- **Problem**: "Certificate not found" or "Invalid certificate"
- **Solution**: Ensure .p12 files are exported correctly with passwords
- **Check**: Certificate filenames match voltbuilder.json exactly

#### Provisioning Profile Errors:

- **Problem**: "No matching provisioning profile"
- **Solution**: Ensure bundle ID matches exactly: `com.bouncecontractor.app`
- **Check**: Provisioning profile includes your certificates

#### Build Fails:

- **Problem**: Various build errors
- **Solution**: Check VoltBuilder logs for specific errors
- **Try**: Start with debug build first, then release

#### Plugin Compatibility:

- **Problem**: Some Capacitor plugins might not work
- **Solution**: VoltBuilder uses Cordova plugins, some mapping may be needed
- **Check**: Build logs for plugin-specific errors

### Getting Help:

- **VoltBuilder Support**: Available through dashboard
- **Documentation**: [docs.voltbuilder.com](https://docs.voltbuilder.com)
- **Apple Developer**: [developer.apple.com/support](https://developer.apple.com/support)

## 📱 Testing Your App

### Development Build:

1. Use `"release": "debug"` in voltbuilder.json
2. Install on registered test devices
3. Use development provisioning profile

### Distribution Build:

1. Use `"release": "release"` in voltbuilder.json
2. Use distribution certificates
3. Choose package type:
   - `"ad-hoc"` - For specific devices
   - `"app-store"` - For App Store submission

## 🎯 Key Differences from Original Capacitor Build

### What Changed:

- **Structure**: `dist/` → `www/` (Cordova standard)
- **Config**: `capacitor.config.json` → `config.xml`
- **Plugins**: Capacitor plugins mapped to Cordova equivalents
- **Build**: Uses Cordova build process instead of Capacitor

### What Stayed the Same:

- **Source Code**: No changes to your React/TypeScript code
- **Assets**: Same images, styles, and resources
- **Functionality**: App behavior should be identical

## 🔄 Future Updates

When you update your app:

1. **Make changes** to your source code as normal
2. **Build for VoltBuilder**:
   ```bash
   npm run voltbuilder:build:cordova
   ```
3. **Add certificates** to the new ZIP file
4. **Upload to VoltBuilder**

## ✅ You're Ready!

Your Bounce Contractor app is now fully prepared for VoltBuilder iOS builds. The conversion from Capacitor to Cordova format is complete, and you have all the tools needed for professional iOS development without a Mac.

**Next Step**: Get your iOS certificates from Apple Developer Portal and start building! 🚀

---

_Generated: August 13, 2025 - Cordova conversion complete_
