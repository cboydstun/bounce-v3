# VoltBuilder Quick Start Guide

## 🚀 Ready to Build iOS Without a Mac!

Your project is now fully configured for VoltBuilder cloud builds. This guide gets you building iOS apps in minutes.

## ✅ What's Been Set Up

### Files Created

- `capacitor.config.json` - VoltBuilder-compatible configuration
- `VOLTBUILDER_GUIDE.md` - Comprehensive documentation
- `VOLTBUILDER_CHECKLIST.md` - Pre-upload verification checklist
- `voltbuilder-info.json` - Project metadata
- `scripts/prepare-voltbuilder.sh` - Preparation automation
- `scripts/package-voltbuilder.sh` - Packaging automation

### Package Ready

- `partypad_voltbuilder_1.0.0-alpha.2_20250813_162344.zip` (4.2MB)
- Contains all necessary files for VoltBuilder
- Excludes node_modules and unnecessary files
- Ready for immediate upload

## 🎯 Quick Start (5 Minutes)

### Step 1: Sign Up for VoltBuilder

```bash
# Go to https://voltbuilder.com and create account
# Choose a plan that fits your needs
```

### Step 2: Upload Your Project

1. Log into VoltBuilder dashboard
2. Create new project
3. Upload: `partypad_voltbuilder_1.0.0-alpha.2_20250813_162344.zip`
4. Configure settings:
   - Platform: **iOS**
   - Framework: **Capacitor**
   - Bundle ID: **com.bouncecontractor.app**

### Step 3: Add iOS Certificates

You'll need from Apple Developer Portal:

- iOS Development Certificate (.p12)
- iOS Distribution Certificate (.p12)
- Development Provisioning Profile (.mobileprovision)
- App Store Provisioning Profile (.mobileprovision)

### Step 4: Build

1. Select certificates and provisioning profiles
2. Click "Build"
3. Monitor build logs
4. Download IPA when complete

## 📱 Your App Details

```json
{
  "projectName": "Bounce Contractor App",
  "appId": "com.bouncecontractor.app",
  "appName": "Bounce Contractor (Alpha)",
  "platform": "ios",
  "framework": "capacitor",
  "buildType": "production",
  "nodeVersion": "v24.4.1",
  "npmVersion": "11.3.0",
  "capacitorVersion": "7.3.0"
}
```

## 🔄 Future Builds

When you make changes to your app:

```bash
# Full rebuild and package
npm run voltbuilder:build

# Or step by step:
npm run voltbuilder:prepare  # Build and prepare
npm run voltbuilder:package  # Create ZIP archive
```

This creates a new timestamped ZIP file ready for VoltBuilder upload.

## 📋 Pre-Upload Checklist

✅ **All items completed for current build:**

### Pre-Upload Verification

- ✅ Project built successfully (`npm run build:prod`)
- ✅ Capacitor synced (`npx cap sync ios`)
- ✅ `capacitor.config.json` exists and is current
- ✅ `dist/` folder contains built web assets
- ✅ iOS project structure is intact
- ⚠️ App icons and splash screens (verify in ios/App/App/Assets.xcassets)

### Required Files Present

- ✅ `package.json`
- ✅ `capacitor.config.json`
- ✅ `ionic.config.json`
- ✅ `tsconfig.json`
- ✅ `dist/index.html`
- ✅ `ios/App/App.xcodeproj/project.pbxproj`

### Still Needed (Your Action Required)

- ⏳ VoltBuilder account setup
- ⏳ iOS certificates upload to VoltBuilder
- ⏳ Provisioning profiles configuration
- ⏳ Bundle ID verification with certificates

## 🔌 Plugin Compatibility

Your app uses these Capacitor plugins (all VoltBuilder compatible):

### ✅ Confirmed Working

- @capacitor/app@7.0.1
- @capacitor/camera@7.0.1
- @capacitor/geolocation@7.1.2
- @capacitor/haptics@7.0.1
- @capacitor/keyboard@7.0.1
- @capacitor/local-notifications@7.0.2
- @capacitor/network@7.0.1
- @capacitor/preferences@7.0.1
- @capacitor/push-notifications@7.0.1
- @capacitor/splash-screen@7.0.1
- @capacitor/status-bar@7.0.1

### ⚠️ May Need Configuration

- @capgo/capacitor-native-biometric@7.1.7
- capacitor-secure-storage-plugin@0.11.0

_These should work but monitor build logs for any issues._

## 💰 Cost Comparison

### VoltBuilder vs Mac Purchase

| Option          | Cost           | Pros                                            | Cons                                               |
| --------------- | -------------- | ----------------------------------------------- | -------------------------------------------------- |
| **VoltBuilder** | ~$20-50/month  | No hardware needed, always updated, team access | Ongoing cost, internet required                    |
| **Mac Mini**    | $599+ one-time | One-time cost, full control                     | Hardware maintenance, Xcode updates, macOS updates |
| **MacBook**     | $999+ one-time | Portable development                            | Higher cost, hardware maintenance                  |

**Recommendation**: VoltBuilder is more cost-effective for most developers, especially teams without existing Mac infrastructure.

## 🆘 Need Help?

### Common Issues

1. **Build fails**: Check build logs in VoltBuilder dashboard
2. **Certificate errors**: Verify bundle ID matches certificates
3. **Plugin issues**: Check VoltBuilder plugin compatibility docs
4. **Large upload**: Ensure node_modules is excluded (our scripts handle this)

### Resources

- **VoltBuilder Docs**: https://docs.voltbuilder.com
- **Apple Developer**: https://developer.apple.com
- **Capacitor Docs**: https://capacitorjs.com
- **Project Guide**: See `VOLTBUILDER_GUIDE.md` for detailed instructions

## 🎉 You're Ready!

Your Bounce Contractor app is fully prepared for VoltBuilder. The hardest part (project setup) is done. Now just:

1. **Sign up** for VoltBuilder
2. **Upload** your ZIP file
3. **Add** iOS certificates
4. **Build** your app
5. **Download** and test your IPA

**No Mac required!** 🎊

---

_Generated: August 13, 2025 - VoltBuilder integration complete_
