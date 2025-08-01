# Firebase App Distribution - Quick Reference

## 🚀 Build & Upload Commands

### Build APK for Firebase

```bash
cd bounce-contractor-app
npm run build:firebase
```

### Upload to Firebase App Distribution

```bash
cd bounce-contractor-app/android
./gradlew appDistributionUploadRelease
```

## 📱 APK Location

After building, your signed APK is located at:

```
bounce-contractor-app/android/app/build/outputs/apk/release/app-release.apk
```

## 🔗 Firebase Console Links

- **App Distribution Dashboard**: https://console.firebase.google.com/project/bouncer-contractor/appdistribution
- **Add Testers**: https://console.firebase.google.com/project/bouncer-contractor/appdistribution/testers
- **Upload Manually**: Click "Distribute app" in the dashboard

## 👥 Next Steps

1. **Add Your 10 Employees as Testers**:

   - Go to Firebase Console → App Distribution → Testers & Groups
   - Click "Add testers"
   - Enter their email addresses

2. **Upload Your First Release**:

   - Use the upload command above, OR
   - Manually upload the APK file in Firebase Console

3. **Send Instructions to Employees**:
   - They install "Firebase App Tester" from Play Store
   - They receive email invitations
   - They download your app through Firebase App Tester

## 🔄 For Future Updates

1. Update version numbers in:

   - `package.json`: `"version": "1.0.0-alpha.2"`
   - `android/app/build.gradle`: `versionCode 2, versionName "1.0.0-alpha.2"`

2. Update release notes in: `android/release-notes.txt`

3. Build and upload: `npm run build:firebase` then upload

## ✅ Current Status

- ✅ Firebase App Distribution configured
- ✅ Build system ready
- ✅ Signed APK generated successfully
- 🔄 Next: Add testers and upload first release

## 📧 Employee Email Template

```
Subject: Alpha Testing - Bounce Contractor Mobile App

Hi team,

You're invited to test our new Bounce Contractor mobile app!

Setup:
1. Install "Firebase App Tester" from Google Play Store
2. Check email for Firebase invitation
3. Tap "Accept invitation"
4. Download "Bounce Contractor (Alpha)" in the app

Updates happen automatically - you'll get notifications when new versions are available.

Please report any bugs or feedback!

Thanks!
```
