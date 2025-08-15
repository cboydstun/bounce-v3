# iOS Build Guide

This guide explains how to build the iOS version of the PartyPad app on different operating systems.

## The Problem

The original `npm run cap:clean:ios` command was failing on Linux systems with a JSON parsing error because the `native-run` utility expects macOS with Xcode and CocoaPods installed to properly detect iOS devices and simulators.

## The Solution

We've implemented an intelligent build system that automatically detects your operating system and runs the appropriate build process.

## Available Commands

### 🔧 Smart Build (Recommended)

```bash
npm run cap:clean:ios
```

- **Automatically detects your OS**
- **macOS**: Runs full build with device deployment
- **Linux/Other**: Runs build and sync only (no device deployment)

### 🐧 Linux-Specific Build

```bash
npm run cap:clean:ios:linux
```

- **Linux/Non-macOS only**: Build and sync without device deployment
- Provides clear next steps for completing the build on macOS

### 🍎 Original macOS Build

```bash
npm run cap:clean:ios:original
```

- **macOS only**: Original command that requires Xcode and CocoaPods
- Use this if you want to bypass the smart detection

## Build Process

### On Linux/Non-macOS Systems

1. ✅ **Cleans** previous builds (`dist/` and `ios/App/App/public/`)
2. ✅ **Builds** the project (`npm run build:prod`)
3. ✅ **Syncs** with iOS (`npx cap sync ios`)
4. ❌ **Skips** device deployment (prevents JSON parsing error)

### On macOS Systems

1. ✅ **Cleans** previous builds
2. ✅ **Builds** the project
3. ✅ **Syncs** with iOS
4. ✅ **Deploys** to iOS device/simulator

## Next Steps After Linux Build

After running the build on Linux, you'll need to complete the process on macOS:

1. **Transfer** the project to a macOS machine
2. **Install** Xcode from the App Store
3. **Install** CocoaPods: `sudo gem install cocoapods`
4. **Navigate** to the iOS directory: `cd ios/App`
5. **Install** dependencies: `pod install`
6. **Open** in Xcode: `open App.xcworkspace`
7. **Build and run** from Xcode

## Alternative Solutions

### CI/CD Services

- **Xcode Cloud**: Apple's official CI/CD service
- **GitHub Actions**: With macOS runners
- **Bitrise**: Mobile-focused CI/CD
- **CircleCI**: With macOS executors

### Cloud Development

- **GitHub Codespaces**: With macOS environments
- **Gitpod**: Cloud-based development environment

## Troubleshooting

### Common Issues

- **CocoaPods not installed**: Install with `sudo gem install cocoapods`
- **Xcode not found**: Install from the App Store
- **Build fails**: Try cleaning Xcode build folder (⌘+Shift+K)

### Error Messages

- `native-run not found`: This is expected on non-macOS systems
- `JSON parsing error`: Fixed by using the smart build system
- `Pod install failed`: Run `pod install` manually in `ios/App/`

## File Structure

```
bounce-contractor-app/
├── scripts/
│   ├── build-ios-linux.sh          # Linux-specific build script
│   └── cap-clean-ios-smart.sh      # Smart OS detection script
└── package.json                    # Updated with new commands
```

## Technical Details

The smart build system works by:

1. Detecting the OS using `$OSTYPE` environment variable
2. Running appropriate build commands based on the detected OS
3. Providing clear feedback and next steps
4. Avoiding the JSON parsing error that occurs on non-macOS systems

This solution maintains compatibility with existing workflows while providing a smooth development experience across different operating systems.
