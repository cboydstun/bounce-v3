# Alpha Release Guide - Google Play Console Internal Testing

This guide walks you through distributing your Bounce Contractor app as an alpha release to your 10 employees using Google Play Console Internal Testing.

## 📋 Prerequisites

- ✅ Google Play Console Developer Account (you have this)
- ✅ Android Studio installed
- ✅ App configured for alpha release (completed)

## 🚀 Phase 1: Build the Alpha Release

### Step 1: Build the App

```bash
cd bounce-contractor-app
npm run build:alpha
```

This script will:

- Clean previous builds
- Build the production web app
- Sync with Capacitor Android
- Prepare for signing

### Step 2: Generate Signed AAB (Android App Bundle)

#### Option A: Using Android Studio (Recommended)

1. Open Android Studio:

   ```bash
   npx cap open android
   ```

2. In Android Studio:

   - Go to **Build** → **Generate Signed Bundle / APK**
   - Select **Android App Bundle**
   - Click **Next**

3. **Create/Select Keystore:**

   - If you don't have a keystore: Click **Create new...**
     - Key store path: `bounce-contractor-app/android/release-key.jks`
     - Password: [Create a strong password - SAVE THIS!]
     - Key alias: `bounce-contractor`
     - Key password: [Same as keystore password]
     - Validity: 25 years
     - Fill in certificate info (Company: Your Company Name)
   - If you have a keystore: Click **Choose existing...**

4. **Build Configuration:**

   - Select **release** build variant
   - Check **V1 (Jar Signature)** and **V2 (Full APK Signature)**
   - Click **Finish**

5. **Locate the AAB:**
   - Find the generated AAB at: `android/app/build/outputs/bundle/release/app-release.aab`

#### Option B: Using Command Line

```bash
cd bounce-contractor-app/android
./gradlew bundleRelease
```

## 🏪 Phase 2: Google Play Console Setup

### Step 1: Create App in Play Console (if not exists)

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in details:
   - **App name:** Bounce Contractor
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept declarations and click **Create app**

### Step 2: Upload App Bundle

1. In your app dashboard, go to **Release** → **Testing** → **Internal testing**
2. Click **Create new release**
3. Upload your AAB file (`app-release.aab`)
4. Add release notes:

   ```
   Alpha Release v1.0.0-alpha.1

   Initial alpha version for internal testing.
   Features included:
   - User authentication
   - Basic app navigation
   - Core functionality setup

   Please test all features and report any issues.
   ```

5. Click **Save** then **Review release**
6. Click **Start rollout to Internal testing**

### Step 3: Add Testers

1. In **Internal testing**, go to **Testers** tab
2. Click **Create email list**
3. **List name:** Alpha Testers
4. Add your 10 employees' Gmail addresses (one per line):
   ```
   employee1@gmail.com
   employee2@gmail.com
   employee3@gmail.com
   ...
   ```
5. Click **Save changes**

### Step 4: Get Opt-in URL

1. In **Internal testing** → **Testers** tab
2. Copy the **Opt-in URL** (looks like: `https://play.google.com/apps/internaltest/...`)

## 📱 Phase 3: Distribute to Employees

### Step 1: Send Instructions to Employees

Send this email to your 10 employees:

---

**Subject:** Alpha Testing - Bounce Contractor Mobile App

Hi team,

You've been selected to test our new Bounce Contractor mobile app! Here's how to get started:

**Installation Steps:**

1. Click this link on your Android phone: [INSERT OPT-IN URL HERE]
2. Tap "Become a tester"
3. Tap "Download it on Google Play"
4. Install the app normally from Google Play Store
5. Look for "Bounce Contractor (Alpha)" on your device

**What to Test:**

- Login/registration process
- App navigation and UI
- Core features and functionality
- Report any crashes or bugs

**Feedback:**
Please send feedback to: [YOUR EMAIL]
Include screenshots for any issues you find.

**Important Notes:**

- This is an alpha version - expect some bugs
- The app will update automatically when we release new versions
- Keep this confidential - don't share outside the team

Thanks for helping us test!

---

### Step 2: Monitor and Support

1. **Check Play Console regularly** for crash reports
2. **Monitor feedback** from your testers
3. **Track adoption** in Internal testing dashboard

## 🔄 Phase 4: Updating the Alpha

When you need to release updates:

### Step 1: Update Version

```bash
# Update version in package.json
"version": "1.0.0-alpha.2"

# Update Android version
# Edit android/app/build.gradle:
versionCode 2
versionName "1.0.0-alpha.2"
```

### Step 2: Build and Upload

```bash
npm run build:alpha
# Then generate new signed AAB and upload to Internal testing
```

### Step 3: Release Notes

Always include clear release notes describing what changed.

## 🛠️ Troubleshooting

### Common Issues:

**"App not compatible with device"**

- Check minimum SDK version in `android/app/build.gradle`
- Ensure target SDK is recent

**"Can't find the app in Play Store"**

- Testers must use the opt-in URL first
- Check if tester's email is added to the list
- Ensure tester is signed in with correct Google account

**Build failures**

- Clean build: `rm -rf dist/ android/app/build/`
- Update dependencies: `npm install`
- Sync Capacitor: `npx cap sync android`

**Signing issues**

- Keep your keystore file safe and backed up
- Never lose your keystore password
- Use the same keystore for all future releases

## 📊 Success Metrics

Track these in Play Console:

- Number of testers who installed
- Crash-free sessions percentage
- User feedback and ratings
- Feature usage analytics

## 🎯 Next Steps

After successful alpha testing:

1. **Closed Testing** (Beta) - Expand to more users
2. **Open Testing** - Public beta
3. **Production Release** - Full Play Store launch

## 🔐 Security Notes

- **Never commit your keystore** to version control
- **Backup your keystore** securely
- **Use strong passwords** for keystore
- **Keep signing credentials** confidential

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Search Google Play Console Help
3. Contact the development team

---

**Important Files Created:**

- `scripts/build-alpha.sh` - Alpha build script
- `ALPHA_RELEASE_GUIDE.md` - This guide
- Updated `package.json` with alpha version
- Updated `capacitor.config.ts` with alpha app name
- Updated `android/app/build.gradle` with alpha version
