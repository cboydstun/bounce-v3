# Alpha Release Quick Reference

## 🚀 Build Alpha Release

```bash
cd bounce-contractor-app
npm run build:alpha
```

## 📱 Generate Signed AAB

### Option 1: Android Studio (Recommended)

```bash
npx cap open android
```

Then: Build → Generate Signed Bundle/APK → Android App Bundle

### Option 2: Command Line

```bash
cd bounce-contractor-app/android
./gradlew bundleRelease
```

## 📋 Google Play Console Steps

1. **Go to:** [Google Play Console](https://play.google.com/console)
2. **Navigate to:** Release → Testing → Internal testing
3. **Create new release** and upload AAB file
4. **Add testers:** Create email list with 10 employee emails
5. **Get opt-in URL** from Testers tab
6. **Send URL to employees**

## 📧 Email Template for Employees

```
Subject: Alpha Testing - Bounce Contractor Mobile App

Hi team,

Test our new Bounce Contractor mobile app:

1. Click: [INSERT OPT-IN URL]
2. Tap "Become a tester"
3. Tap "Download it on Google Play"
4. Install "Bounce Contractor (Alpha)"

Send feedback to: [YOUR EMAIL]

Thanks!
```

## 🔄 Update Alpha Version

1. **Update versions:**

   - `package.json`: `"version": "1.0.0-alpha.2"`
   - `android/app/build.gradle`: `versionCode 2, versionName "1.0.0-alpha.2"`

2. **Build and upload:**
   ```bash
   npm run build:alpha
   # Then generate new AAB and upload to Play Console
   ```

## 📁 Key Files

- `scripts/build-alpha.sh` - Build script
- `ALPHA_RELEASE_GUIDE.md` - Complete guide
- `android/app/build/outputs/bundle/release/app-release.aab` - Generated AAB file

## 🆘 Troubleshooting

- **Build fails:** `rm -rf dist/ android/app/build/` then retry
- **Can't find app:** Ensure testers use opt-in URL first
- **Signing issues:** Keep keystore safe, never lose password

## ✅ Current Status

- ✅ App configured for alpha (v1.0.0-alpha.1)
- ✅ Build script created and tested
- ✅ Android project ready for signing
- 🔄 Next: Generate signed AAB and upload to Play Console
