# iOS Quick Reference Guide

## Available iOS Scripts

### Development Testing (iPhone)

```bash
npm run build:ios-dev
```

- Cleans previous builds
- Builds production web app
- Syncs with Capacitor iOS
- Opens Xcode for direct iPhone testing

### Firebase App Distribution

```bash
npm run build:firebase-ios
```

- Prepares app for Firebase distribution
- Opens Xcode for manual archiving
- Provides Firebase upload instructions

### Basic Capacitor Commands

```bash
# Run on iOS simulator/device
npm run cap:run:ios

# Build iOS (basic)
npm run cap:build:ios

# Clean build and run
npm run cap:clean:ios

# Sync only
npx cap sync ios

# Open in Xcode
npx cap open ios
```

## iPhone Testing Workflow

1. **First Time Setup:**

   - Install Xcode from Mac App Store
   - Sign in with Apple ID in Xcode Preferences > Accounts
   - Connect iPhone via USB
   - Trust computer on iPhone when prompted

2. **Build and Test:**

   ```bash
   npm run build:ios-dev
   ```

   - This opens Xcode automatically
   - Select your iPhone as target device
   - Click Play button to build and install

3. **Enable Developer Mode (iOS 16+):**

   - Settings > Privacy & Security > Developer Mode
   - Toggle on and restart iPhone

4. **Trust Developer Certificate:**
   - Settings > General > VPN & Device Management
   - Trust your developer certificate

## Firebase App Distribution Workflow

1. **Prerequisites:**

   - Firebase project with iOS app configured
   - Firebase CLI installed: `npm install -g firebase-tools`
   - Authenticated: `firebase login`

2. **Build and Archive:**

   ```bash
   npm run build:firebase-ios
   ```

3. **In Xcode (after script opens it):**

   - Select "Any iOS Device (arm64)"
   - Product > Archive
   - Wait for archive completion
   - Organizer > Distribute App > Ad Hoc
   - Export .ipa file

4. **Upload to Firebase:**
   ```bash
   firebase appdistribution:distribute path/to/app.ipa \
     --app YOUR_IOS_APP_ID \
     --groups "testers" \
     --release-notes "iOS Alpha Release"
   ```

## Troubleshooting

### Common Issues:

**"Untrusted Developer" Error:**

- Settings > General > VPN & Device Management
- Trust your developer profile

**Signing Issues:**

- Xcode > Preferences > Accounts
- Download manual profiles
- Check Bundle Identifier matches

**Build Failures:**

- Clean build folder: Product > Clean Build Folder
- Delete derived data: Xcode > Preferences > Locations > Derived Data

**Device Not Recognized:**

- Window > Devices and Simulators
- Trust device if needed
- Check USB connection

### Useful Xcode Shortcuts:

- `Cmd + R` - Build and run
- `Cmd + Shift + K` - Clean build folder
- `Cmd + Shift + 2` - Devices and Simulators

## File Locations

- **iOS Project:** `ios/App/`
- **Build Scripts:** `scripts/build-ios-*.sh`
- **Capacitor Config:** `capacitor.config.ts`
- **Web Build Output:** `dist/`
- **iOS Assets:** `ios/App/App/public/`

## Next Steps After Testing

1. Test core functionality on iPhone
2. Set up Firebase App Distribution
3. Add iOS testers to Firebase project
4. Consider TestFlight for broader testing
5. Prepare for App Store submission
