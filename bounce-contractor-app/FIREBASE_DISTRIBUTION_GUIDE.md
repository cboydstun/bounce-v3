# Firebase App Distribution Guide

This guide walks you through distributing your Bounce Contractor app using Firebase App Distribution - a professional alternative to Google Play Console Internal Testing.

## 🎯 Why Firebase App Distribution?

- ✅ **Independent of Google Play Console** - No developer account issues
- ✅ **Professional Experience** - Testers get proper app distribution
- ✅ **Easy Installation** - No "Unknown Sources" warnings
- ✅ **Automatic Updates** - Push new versions instantly
- ✅ **Analytics & Crash Reports** - Built-in monitoring
- ✅ **100% Free** - No costs or limits

## 🚀 Quick Start

### Step 1: Build for Firebase Distribution

```bash
cd bounce-contractor-app
npm run build:firebase
```

### Step 2: Upload to Firebase (Choose One)

#### Option A: Automatic Upload (Recommended)

```bash
cd android
./gradlew appDistributionUploadRelease
```

#### Option B: Manual Upload

1. Go to [Firebase Console](https://console.firebase.google.com/project/bouncer-contractor/appdistribution)
2. Click "Distribute app"
3. Upload: `android/app/build/outputs/apk/release/app-release.apk`
4. Add release notes and testers

### Step 3: Invite Your 10 Employees

1. In Firebase Console → App Distribution
2. Click "Testers & Groups"
3. Add tester emails or create "alpha-testers" group
4. Assign testers to your release

## 📱 Employee Installation Process

### For Your Employees:

1. **Install Firebase App Tester**

   - Download from Google Play Store: "Firebase App Tester"

2. **Accept Invitation**

   - Check email for Firebase App Distribution invitation
   - Tap "Accept invitation" in the email

3. **Download & Install**

   - Open Firebase App Tester app
   - Find "Bounce Contractor (Alpha)"
   - Tap "Download" and install

4. **Get Updates**
   - Updates appear automatically in Firebase App Tester
   - No need to re-download or reinstall

## 🔧 Configuration Details

### Firebase Project Setup ✅

- Project: `bouncer-contractor`
- Android App: `com.bouncecontractor.app`
- App Distribution: Enabled

### Build Configuration ✅

- Firebase App Distribution plugin: Added
- Release signing: Configured
- APK generation: Ready
- Release notes: Automated

### Tester Management

- **Current Setup**: Placeholder testers in build.gradle
- **Next Step**: Add your 10 employees' emails

## 📋 Adding Your Employees as Testers

### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/bouncer-contractor/appdistribution)
2. Click "Testers & Groups"
3. Click "Add testers"
4. Enter your employees' email addresses:
   ```
   employee1@company.com
   employee2@company.com
   employee3@company.com
   ...
   ```

### Method 2: Update Build Configuration

Edit `android/app/build.gradle` and replace:

```gradle
testers = "your-testers@example.com"
```

With your actual employee emails:

```gradle
testers = "emp1@company.com,emp2@company.com,emp3@company.com"
```

## 🔄 Release Process

### For Each New Alpha Version:

1. **Update Version Numbers**

   ```bash
   # Update package.json
   "version": "1.0.0-alpha.2"

   # Update android/app/build.gradle
   versionCode 2
   versionName "1.0.0-alpha.2"
   ```

2. **Update Release Notes**
   Edit `android/release-notes.txt` with new features/fixes

3. **Build and Upload**

   ```bash
   npm run build:firebase
   cd android
   ./gradlew appDistributionUploadRelease
   ```

4. **Notify Testers**
   - Firebase automatically sends notifications
   - Testers get updates in Firebase App Tester app

## 📊 Monitoring & Analytics

### Firebase Console Dashboard

- **Downloads**: Track who downloaded the app
- **Installations**: See successful installs
- **Crashes**: Automatic crash reporting
- **Feedback**: Collect tester feedback

### Access Analytics

1. Go to [Firebase Console](https://console.firebase.google.com/project/bouncer-contractor/appdistribution)
2. Select your app release
3. View download and installation metrics

## 🛠️ Troubleshooting

### Build Issues

```bash
# Clean build if issues occur
cd android
./gradlew clean
./gradlew assembleRelease
```

### Upload Issues

- Ensure you're authenticated with Firebase CLI
- Check internet connection
- Verify Firebase project permissions

### Tester Issues

- **Can't find app**: Ensure they installed Firebase App Tester
- **No invitation**: Check spam folder, re-send invitation
- **Install fails**: Ensure Android device allows app installs

## 🔐 Security & Best Practices

### Keystore Management

- ✅ Release keystore configured
- ✅ Passwords stored in gradle.properties
- ⚠️ **Never commit gradle.properties with real passwords**

### Tester Management

- Only invite trusted employees
- Remove testers when they leave the company
- Use groups for easier management

## 📧 Email Template for Employees

Send this to your 10 employees:

---

**Subject:** Alpha Testing - Bounce Contractor Mobile App (Firebase Distribution)

Hi team,

You're invited to test our new Bounce Contractor mobile app through Firebase App Distribution!

**Setup (One-time):**

1. Install "Firebase App Tester" from Google Play Store
2. Check your email for the Firebase invitation
3. Tap "Accept invitation" in the email

**Installing the App:**

1. Open Firebase App Tester app
2. Find "Bounce Contractor (Alpha)"
3. Tap "Download" and install

**Updates:**

- New versions appear automatically in Firebase App Tester
- You'll get notifications when updates are available
- Just tap "Update" to get the latest version

**Feedback:**
Please report bugs, crashes, or suggestions to: [YOUR EMAIL]

Thanks for helping us test!

---

## 🎯 Next Steps

1. **Add your employee emails** to Firebase Console
2. **Build and upload** your first release
3. **Send invitation email** to employees
4. **Monitor adoption** in Firebase Console

## 📞 Support

- **Firebase Console**: https://console.firebase.google.com/project/bouncer-contractor/appdistribution
- **Firebase Documentation**: https://firebase.google.com/docs/app-distribution
- **Build Issues**: Check this guide's troubleshooting section

---

**Files Created/Modified:**

- `scripts/build-firebase-alpha.sh` - Firebase build script
- `android/release-notes.txt` - Release notes template
- `android/build.gradle` - Added Firebase App Distribution plugin
- `android/app/build.gradle` - Added Firebase configuration
- `package.json` - Added `build:firebase` script
